"use client";

import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { useCanvasStore } from "@/store/canvas-store";
import { useViewportStore } from "@/store/viewport-store";
import { useToolStore } from "@/store/tool-store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useElementSize } from "@/hooks/use-element-size";
import {
  boundsIntersect,
  getShapeBounds,
  normalizeBounds,
  screenToWorld,
  type Point,
  type Viewport,
} from "@/lib/geometry";
import {
  createShape,
  extendDraftShape,
  isMeaningfulShape,
  normalizeDraftShape,
} from "@/lib/shape-factory";
import { createShapeNode, applyShapeAttrs } from "@/lib/konva-shape";
import { getSocket } from "@/lib/socket";
import { useBoardRealtime } from "@/hooks/use-board-realtime";
import type { CanvasShape, TextCanvasShape, ToolType } from "@/types/canvas";
import { TextEditorOverlay } from "@/components/canvas/text-editor-overlay";
import { GridBackground } from "@/components/canvas/grid-background";
import { Toolbar } from "@/components/canvas/toolbar";
import { PropertiesPanel } from "@/components/canvas/properties-panel";
import { ZoomControls } from "@/components/canvas/zoom-controls";
import { StatusBar } from "@/components/canvas/status-bar";
import { RemoteCursors } from "@/components/canvas/remote-cursors";
import { CommentPins } from "@/components/canvas/comment-pins";
import { CommentsPanel } from "@/components/canvas/comments-panel";
import { ExportMenu } from "@/components/canvas/export-menu";
import { OnboardingHint } from "@/components/canvas/onboarding-hint";

interface DragOrigin {
  startPositions: Map<string, Point>;
}

interface LatestState {
  shapes: CanvasShape[];
  selectedIds: string[];
  tool: ToolType;
  viewport: Viewport;
  style: { stroke: string; fill: string; strokeWidth: number };
  drawStart: Point | null;
  draftShape: CanvasShape | null;
  selectionBox: { start: Point; end: Point } | null;
}

interface BoardCanvasProps {
  boardId: string;
  title: string;
}

export function BoardCanvas({ boardId, title }: BoardCanvasProps) {
  const { ref: containerRef, size } = useElementSize<HTMLDivElement>();
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const nodesRef = useRef<Map<string, Konva.Shape>>(new Map());
  const lastAppliedShapeRef = useRef<Map<string, CanvasShape>>(new Map());
  const draftNodeRef = useRef<Konva.Shape | null>(null);
  const selectionRectRef = useRef<Konva.Rect | null>(null);

  const isPanning = useRef(false);
  const panStart = useRef<Point | null>(null);
  const isSpaceHeld = useRef(false);
  const dragOrigin = useRef<DragOrigin | null>(null);
  const lastCursorEmit = useRef(0);

  const { cursors } = useBoardRealtime(boardId);

  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [draftShape, setDraftShape] = useState<CanvasShape | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ start: Point; end: Point } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const shapes = useCanvasStore((s) => s.shapes);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const viewOnly = useCanvasStore((s) => s.role === "VIEWER");
  const offline = useCanvasStore((s) => s.offline);
  const locked = viewOnly || offline;

  const { x, y, scale } = useViewportStore();

  const tool = useToolStore((s) => s.tool);
  const strokeColor = useToolStore((s) => s.strokeColor);
  const fillColor = useToolStore((s) => s.fillColor);
  const strokeWidth = useToolStore((s) => s.strokeWidth);

  useKeyboardShortcuts();

  const viewport: Viewport = { x, y, scale };

  const stateRef = useRef<LatestState>({
    shapes,
    selectedIds,
    tool,
    viewport,
    style: { stroke: strokeColor, fill: fillColor, strokeWidth },
    drawStart,
    draftShape,
    selectionBox,
  });
  useEffect(() => {
    stateRef.current = {
      shapes,
      selectedIds,
      tool,
      viewport,
      style: { stroke: strokeColor, fill: fillColor, strokeWidth },
      drawStart,
      draftShape,
      selectionBox,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, selectedIds, tool, x, y, scale, strokeColor, fillColor, strokeWidth, drawStart, draftShape, selectionBox]);

  // Spacebar-held-to-pan
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" && !(e.target instanceof HTMLTextAreaElement)) {
        isSpaceHeld.current = true;
      }
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") isSpaceHeld.current = false;
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  function handleShapeDragStart(id: string) {
    const stage = stageRef.current;
    if (!stage) return;

    const { selectedIds: selected } = stateRef.current;
    if (!selected.includes(id)) {
      useCanvasStore.getState().setSelectedIds([id]);
    }
    const effective = selected.includes(id) ? selected : [id];

    const startPositions = new Map<string, Point>();
    effective.forEach((sid) => {
      const node = stage.findOne(`#${sid}`);
      if (node) startPositions.set(sid, { x: node.x(), y: node.y() });
    });
    dragOrigin.current = { startPositions };
  }

  function handleShapeDragMove(id: string, node: Konva.Node) {
    const origin = dragOrigin.current;
    const stage = stageRef.current;
    if (!origin || !stage) return;

    const start = origin.startPositions.get(id);
    if (!start) return;

    const dx = node.x() - start.x;
    const dy = node.y() - start.y;

    origin.startPositions.forEach((pos, sid) => {
      if (sid === id) return;
      const n = stage.findOne(`#${sid}`);
      if (n) {
        n.x(pos.x + dx);
        n.y(pos.y + dy);
      }
    });
  }

  function handleShapeDragEnd() {
    const origin = dragOrigin.current;
    const stage = stageRef.current;
    if (!origin || !stage) return;

    const { shapes: currentShapes } = stateRef.current;
    const updates: { id: string; patch: Partial<CanvasShape> }[] = [];
    origin.startPositions.forEach((_pos, sid) => {
      const node = stage.findOne(`#${sid}`);
      const shape = currentShapes.find((s) => s.id === sid);
      if (!node || !shape) return;

      if (shape.type === "ellipse") {
        updates.push({
          id: sid,
          patch: { x: node.x() - shape.width / 2, y: node.y() - shape.height / 2 },
        });
      } else {
        updates.push({ id: sid, patch: { x: node.x(), y: node.y() } });
      }
    });
    useCanvasStore.getState().updateShapes(updates);
    dragOrigin.current = null;
  }

  function handleTransformEnd(nodes: Konva.Node[]) {
    const { shapes: currentShapes } = stateRef.current;
    const updates = nodes.map((node) => {
      const id = node.id();
      const shape = currentShapes.find((s) => s.id === id) as CanvasShape;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const rotation = node.rotation();
      node.scaleX(1);
      node.scaleY(1);

      if (shape.type === "rectangle") {
        const width = Math.max(4, shape.width * scaleX);
        const height = Math.max(4, shape.height * scaleY);
        return { id, patch: { x: node.x(), y: node.y(), width, height, rotation } };
      }
      if (shape.type === "ellipse") {
        const width = Math.max(4, shape.width * scaleX);
        const height = Math.max(4, shape.height * scaleY);
        return {
          id,
          patch: { x: node.x() - width / 2, y: node.y() - height / 2, width, height, rotation },
        };
      }
      if (shape.type === "text") {
        const width = Math.max(20, shape.width * scaleX);
        return { id, patch: { x: node.x(), y: node.y(), width, rotation } };
      }
      const points = shape.points.map((p, i) => (i % 2 === 0 ? p * scaleX : p * scaleY));
      return { id, patch: { x: node.x(), y: node.y(), points, rotation } };
    });
    useCanvasStore.getState().updateShapes(updates);
  }

  function attachShapeEvents(node: Konva.Shape) {
    node.on("click", (e) => {
      e.cancelBubble = true;
      const additive = Boolean((e.evt as MouseEvent).shiftKey);
      const id = node.id();
      const { selectedIds: selected } = stateRef.current;
      if (additive) {
        useCanvasStore
          .getState()
          .setSelectedIds(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
      } else {
        useCanvasStore.getState().setSelectedIds([id]);
      }
    });
    node.on("dblclick", () => {
      const { role, offline: isOffline } = useCanvasStore.getState();
      if (role === "VIEWER" || isOffline) return;
      const shape = stateRef.current.shapes.find((s) => s.id === node.id());
      if (shape?.type === "text") setEditingTextId(shape.id);
    });
    node.on("dragstart", () => handleShapeDragStart(node.id()));
    node.on("dragmove", () => handleShapeDragMove(node.id(), node));
    node.on("dragend", () => handleShapeDragEnd());
  }

  function handleStageMouseDown(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const { tool: currentTool, viewport: currentViewport, style } = stateRef.current;
    const isBackgroundClick = e.target === stage;

    if (currentTool === "hand" || isSpaceHeld.current || (e.evt instanceof MouseEvent && e.evt.button === 1)) {
      isPanning.current = true;
      panStart.current = pointer;
      return;
    }

    if (!isBackgroundClick) return;

    const world = screenToWorld(pointer, currentViewport);

    if (currentTool === "select") {
      useCanvasStore.getState().setSelectedIds([]);
      setSelectionBox({ start: world, end: world });
      return;
    }

    if (currentTool === "text") {
      // Stop the browser moving focus to the canvas after this press, which would close the editor straight away.
      e.evt.preventDefault();
      const shape = createShape("text", world.x, world.y, style) as TextCanvasShape;
      useCanvasStore.getState().addShape(shape);
      setEditingTextId(shape.id);
      useToolStore.getState().setTool("select");
      return;
    }

    setDrawStart(world);
    setDraftShape(createShape(currentTool, world.x, world.y, style));
  }

  function handleStageMouseMove() {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const { viewport: currentViewport, drawStart: start, draftShape: draft, selectionBox: box } =
      stateRef.current;

    if (isPanning.current && panStart.current) {
      const dx = pointer.x - panStart.current.x;
      const dy = pointer.y - panStart.current.y;
      useViewportStore.getState().setViewport({ x: currentViewport.x + dx, y: currentViewport.y + dy });
      panStart.current = pointer;
      return;
    }

    const world = screenToWorld(pointer, currentViewport);

    const now = Date.now();
    if (now - lastCursorEmit.current > 50) {
      getSocket().emit("cursor:move", world);
      lastCursorEmit.current = now;
    }

    if (box) {
      setSelectionBox({ start: box.start, end: world });
      return;
    }

    if (draft && start) {
      setDraftShape(extendDraftShape(draft, start, world));
    }
  }

  function handleStageMouseUp() {
    if (isPanning.current) {
      isPanning.current = false;
      panStart.current = null;
      return;
    }

    const { shapes: currentShapes, selectionBox: box, draftShape: draft } = stateRef.current;

    if (box) {
      const bounds = normalizeBounds(box.start, box.end);
      const ids = currentShapes.filter((s) => boundsIntersect(getShapeBounds(s), bounds)).map((s) => s.id);
      useCanvasStore.getState().setSelectedIds(ids);
      setSelectionBox(null);
      return;
    }

    if (draft) {
      const normalized = normalizeDraftShape(draft);
      if (isMeaningfulShape(normalized)) {
        useCanvasStore.getState().addShape(normalized);
      }
      setDraftShape(null);
      setDrawStart(null);
      useToolStore.getState().setTool("select");
    }
  }

  function handleStageWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const { viewport: currentViewport } = stateRef.current;

    if (e.evt.ctrlKey || e.evt.metaKey) {
      const factor = e.evt.deltaY > 0 ? 1 / 1.05 : 1.05;
      useViewportStore.getState().zoomBy(factor, pointer);
    } else {
      useViewportStore
        .getState()
        .setViewport({ x: currentViewport.x - e.evt.deltaX, y: currentViewport.y - e.evt.deltaY });
    }
  }

  // Mount Konva stage/layer/transformer once
  useEffect(() => {
    if (!stageContainerRef.current) return;

    const stage = new Konva.Stage({
      container: stageContainerRef.current,
      width: size.width || 1,
      height: size.height || 1,
    });
    const layer = new Konva.Layer();
    stage.add(layer);

    const transformer = new Konva.Transformer({
      rotateEnabled: true,
      flipEnabled: false,
      borderStroke: "#f4d35e",
      borderStrokeWidth: 1.5,
      anchorStroke: "#f4d35e",
      anchorFill: "#1c2a26",
      anchorSize: 8,
      anchorCornerRadius: 2,
    });
    transformer.on("transformend", () => handleTransformEnd(transformer.nodes()));
    layer.add(transformer);

    stage.on("mousedown touchstart", handleStageMouseDown);
    stage.on("mousemove touchmove", handleStageMouseMove);
    stage.on("mouseup touchend touchcancel", handleStageMouseUp);
    stage.on("wheel", handleStageWheel);

    stageRef.current = stage;
    layerRef.current = layer;
    transformerRef.current = transformer;

    const nodes = nodesRef.current;

    return () => {
      stage.destroy();
      stageRef.current = null;
      layerRef.current = null;
      transformerRef.current = null;
      nodes.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep stage size in sync with container
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || size.width === 0) return;
    stage.width(size.width);
    stage.height(size.height);
    stage.batchDraw();
  }, [size.width, size.height]);

  // Keep stage pan/zoom in sync with viewport store
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.position({ x, y });
    stage.scale({ x: scale, y: scale });
    stage.batchDraw();
  }, [x, y, scale]);

  // Reconcile shape nodes with store
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const nodes = nodesRef.current;
    const lastApplied = lastAppliedShapeRef.current;
    const currentIds = new Set(shapes.map((s) => s.id));

    nodes.forEach((node, id) => {
      if (!currentIds.has(id)) {
        node.destroy();
        nodes.delete(id);
        lastApplied.delete(id);
      }
    });

    shapes.forEach((shape) => {
      let node = nodes.get(shape.id);
      if (!node) {
        node = createShapeNode(shape);
        node.draggable(stateRef.current.tool === "select" && useCanvasStore.getState().role !== "VIEWER" && !useCanvasStore.getState().offline);
        node.listening(stateRef.current.tool === "select");
        attachShapeEvents(node);
        layer.add(node);
        nodes.set(shape.id, node);
        lastApplied.set(shape.id, shape);
      } else if (lastApplied.get(shape.id) !== shape) {
        applyShapeAttrs(node, shape);
        lastApplied.set(shape.id, shape);
      }
      node.visible(shape.id !== editingTextId);
    });

    transformerRef.current?.moveToTop();
    layer.batchDraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, editingTextId]);

  // Keep draggable state, selection highlight in sync
  useEffect(() => {
    const nodes = nodesRef.current;
    nodes.forEach((node) => {
      node.draggable(tool === "select" && !locked);
      // With a drawing tool active, presses go through existing shapes to the board, so a new shape or arrow
      // can start on top of one.
      node.listening(tool === "select");
    });

    const stage = stageRef.current;
    const selectedNodes =
      tool === "select" && !locked && stage
        ? selectedIds.map((id) => stage.findOne(`#${id}`)).filter((n): n is Konva.Node => Boolean(n))
        : [];
    transformerRef.current?.nodes(selectedNodes);
    layerRef.current?.batchDraw();
  }, [tool, selectedIds, locked]);

  // Draft shape preview while drawing
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    if (draftNodeRef.current) {
      draftNodeRef.current.destroy();
      draftNodeRef.current = null;
    }
    if (draftShape) {
      const node = createShapeNode(draftShape);
      node.listening(false);
      layer.add(node);
      draftNodeRef.current = node;
    }
    layer.batchDraw();
  }, [draftShape]);

  // Selection marquee box
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    if (selectionRectRef.current) {
      selectionRectRef.current.destroy();
      selectionRectRef.current = null;
    }
    if (selectionBox) {
      const bounds = normalizeBounds(selectionBox.start, selectionBox.end);
      const rect = new Konva.Rect({
        x: bounds.x1,
        y: bounds.y1,
        width: bounds.x2 - bounds.x1,
        height: bounds.y2 - bounds.y1,
        fill: "rgba(244, 211, 94, 0.1)",
        stroke: "#f4d35e",
        strokeWidth: 1,
        listening: false,
      });
      layer.add(rect);
      selectionRectRef.current = rect;
    }
    layer.batchDraw();
  }, [selectionBox]);

  const editingShape = shapes.find((s) => s.id === editingTextId && s.type === "text") as
    | TextCanvasShape
    | undefined;

  const cursor = tool === "hand" ? "grab" : tool === "select" ? "default" : "crosshair";

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-background" style={{ cursor }}>
      <GridBackground />
      <div ref={stageContainerRef} className="absolute inset-0 touch-none" />

      {editingShape && (
        <TextEditorOverlay
          shape={editingShape}
          viewport={viewport}
          onCommit={(text) => {
            if (text.trim() === "") {
              useCanvasStore.getState().deleteShapes([editingShape.id]);
            } else {
              useCanvasStore.getState().updateShape(editingShape.id, { text });
            }
            setEditingTextId(null);
          }}
        />
      )}

      <RemoteCursors cursors={cursors} viewport={viewport} />
      <CommentPins boardId={boardId} viewport={viewport} />

      <div className="absolute right-4 top-4 z-10 rounded-xl border bg-card p-1 shadow-lg">
        <ExportMenu stageRef={stageRef} layerRef={layerRef} title={title} />
      </div>

      <Toolbar />
      <PropertiesPanel />
      <CommentsPanel boardId={boardId} />
      <ZoomControls viewportSize={size} />
      <StatusBar />
      <OnboardingHint />
    </div>
  );
}
