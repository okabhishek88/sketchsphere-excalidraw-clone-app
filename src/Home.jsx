import React, { useRef, useState } from 'react'
import './Home.css'
import { TbRectangle } from 'react-icons/tb'
import { IoMdDownload } from 'react-icons/io'
import { FaLongArrowAltRight } from 'react-icons/fa'
import { LuPencil } from 'react-icons/lu'
import { GiArrowCursor } from 'react-icons/gi'
import { FaRegCircle } from 'react-icons/fa6'
import { MdUndo, MdRedo } from 'react-icons/md'
import { Stage, Layer, Rect, Circle, Arrow, Line } from 'react-konva'
import { ACTIONS } from './constants.js'
import { v4 as uuidv4 } from 'uuid'

const Home = () => {
    const stageRef = useRef()
    const [action, setAction] = useState(ACTIONS.SELECT)
    const [color, setColor] = useState('#000000')
    const [shapes, setShapes] = useState([])
    const [history, setHistory] = useState([])
    const [redoStack, setRedoStack] = useState([])
    const isPainting = useRef(false)
    const currentShapeId = useRef(null)

    function onPointerDown() {
        if (action === ACTIONS.SELECT) return
        const stage = stageRef.current
        const { x, y } = stage.getPointerPosition()
        const id = uuidv4()
        currentShapeId.current = id
        isPainting.current = true
        let newShape
        if (action === ACTIONS.RECTANGLE) {
            newShape = { type: 'rect', id, x, y, width: 0, height: 0, stroke: color, strokeWidth: 2 }
        } else if (action === ACTIONS.CIRCLE) {
            newShape = { type: 'circle', id, x, y, radius: 0, stroke: color, strokeWidth: 2 }
        } else if (action === ACTIONS.ARROW) {
            newShape = { type: 'arrow', id, points: [x, y, x, y], stroke: color, strokeWidth: 2 }
        } else if (action === ACTIONS.SCRIBBLE) {
            newShape = { type: 'scribble', id, points: [x, y], stroke: color, strokeWidth: 2 }
        }
        setShapes(prev => {
            const newShapes = [...prev, newShape]
            setHistory(prev => [...prev, newShapes])
            setRedoStack([])
            return newShapes
        })
    }

    function onPointerMove() {
        if (action === ACTIONS.SELECT || !isPainting.current) return
        const stage = stageRef.current
        const { x, y } = stage.getPointerPosition()
        setShapes(prev =>
            prev.map(item =>
                item.id === currentShapeId.current
                    ? action === ACTIONS.RECTANGLE
                        ? { ...item, width: x - item.x, height: y - item.y }
                        : action === ACTIONS.CIRCLE
                            ? { ...item, radius: Math.sqrt(Math.pow(x - item.x, 2) + Math.pow(y - item.y, 2)) / 2 }
                            : action === ACTIONS.ARROW
                                ? { ...item, points: [item.points[0], item.points[1], x, y] }
                                : action === ACTIONS.SCRIBBLE
                                    ? { ...item, points: [...item.points, x, y] }
                                    : item
                    : item
            )
        )
    }

    function onPointerUp() {
        isPainting.current = false
        currentShapeId.current = null
    }

    function exportImage() {
        const uri = stageRef.current.toDataURL()
        const link = document.createElement('a')
        link.href = uri
        link.download = 'canvas_image.png'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    function handleDragEnd(id, x, y) {
        setShapes(prev => {
            const newShapes = prev.map(item =>
                item.id === id ? { ...item, x, y } : item
            )
            setHistory(prev => [...prev, newShapes])
            setRedoStack([])
            return newShapes
        })
    }

    function handleResize(id, width, height) {
        setShapes(prev => {
            const newShapes = prev.map(item =>
                item.id === id ? { ...item, width, height } : item
            )
            setHistory(prev => [...prev, newShapes])
            setRedoStack([])
            return newShapes
        })
    }

    function undo() {
        if (history.length <= 1) return
        setRedoStack(prev => [shapes, ...prev])
        setShapes(history[history.length - 2])
        setHistory(prev => prev.slice(0, -1))
    }

    function redo() {
        if (redoStack.length === 0) return
        setShapes(redoStack[0])
        setHistory(prev => [...prev, redoStack[0]])
        setRedoStack(prev => prev.slice(1))
    }

    return (
        <div className="home">
            <div className="navbar">
                <button className={action === ACTIONS.SELECT ? 'active' : ''} onClick={() => setAction(ACTIONS.SELECT)}>
                    <GiArrowCursor size="1.5rem" />
                </button>
                <button className={action === ACTIONS.RECTANGLE ? 'active' : ''} onClick={() => setAction(ACTIONS.RECTANGLE)}>
                    <TbRectangle size="1.5rem" />
                </button>
                <button className={action === ACTIONS.CIRCLE ? 'active' : ''} onClick={() => setAction(ACTIONS.CIRCLE)}>
                    <FaRegCircle size="1.5rem" />
                </button>
                <button className={action === ACTIONS.ARROW ? 'active' : ''} onClick={() => setAction(ACTIONS.ARROW)}>
                    <FaLongArrowAltRight size="1.5rem" />
                </button>
                <button className={action === ACTIONS.SCRIBBLE ? 'active' : ''} onClick={() => setAction(ACTIONS.SCRIBBLE)}>
                    <LuPencil size="1.5rem" />
                </button>
                <button className="color-button" style={{ backgroundColor: color }}>
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} className="color-input" />
                </button>
                <button onClick={undo} disabled={history.length <= 1}>
                    <MdUndo size="1.5rem" />
                </button>
                <button onClick={redo} disabled={redoStack.length === 0}>
                    <MdRedo size="1.5rem" />
                </button>
                <button onClick={exportImage}>
                    <IoMdDownload size="1.5rem" />
                </button>
            </div>
            <Stage
                ref={stageRef}
                width={window.innerWidth}
                height={window.innerHeight - 48}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
            >
                <Layer>
                    <Rect x={0} y={0} width={window.innerWidth} height={window.innerHeight} fill="#f5f5f5" shadowBlur={10} id="canvas" />
                    {shapes.map(item => {
                        if (item.type === 'rect') {
                            return (
                                <Rect
                                    key={item.id}
                                    x={item.x}
                                    y={item.y}
                                    width={item.width}
                                    height={item.height}
                                    stroke={item.stroke}
                                    strokeWidth={item.strokeWidth}
                                    draggable={action === ACTIONS.SELECT}
                                    onDragEnd={e => handleDragEnd(item.id, e.target.x(), e.target.y())}
                                    onTransformEnd={e => {
                                        const node = e.target
                                        handleResize(item.id, node.width() * node.scaleX(), node.height() * node.scaleY())
                                        node.scaleX(1)
                                        node.scaleY(1)
                                    }}
                                />
                            )
                        } else if (item.type === 'circle') {
                            return (
                                <Circle
                                    key={item.id}
                                    x={item.x}
                                    y={item.y}
                                    radius={item.radius}
                                    stroke={item.stroke}
                                    strokeWidth={item.strokeWidth}
                                    draggable={action === ACTIONS.SELECT}
                                    onDragEnd={e => handleDragEnd(item.id, e.target.x(), e.target.y())}
                                    onTransformEnd={e => {
                                        const node = e.target
                                        handleResize(item.id, node.radius() * node.scaleX(), node.radius() * node.scaleY())
                                        node.scaleX(1)
                                        node.scaleY(1)
                                    }}
                                />
                            )
                        } else if (item.type === 'arrow') {
                            return (
                                <Arrow
                                    key={item.id}
                                    points={item.points}
                                    stroke={item.stroke}
                                    strokeWidth={item.strokeWidth}
                                    pointerLength={10}
                                    pointerWidth={10}
                                    draggable={action === ACTIONS.SELECT}
                                    onDragEnd={e => {
                                        const dx = e.target.x()
                                        const dy = e.target.y()
                                        setShapes(prev =>
                                            prev.map(a =>
                                                a.id === item.id
                                                    ? { ...a, points: [a.points[0] + dx, a.points[1] + dy, a.points[2] + dx, a.points[3] + dy] }
                                                    : a
                                            )
                                        )
                                        e.target.position({ x: 0, y: 0 })
                                    }}
                                />
                            )
                        } else if (item.type === 'scribble') {
                            return (
                                <Line
                                    key={item.id}
                                    points={item.points}
                                    stroke={item.stroke}
                                    strokeWidth={item.strokeWidth}
                                    lineCap="round"
                                    lineJoin="round"
                                />
                            )
                        }
                        return null
                    })}
                </Layer>
            </Stage>
        </div>
    )
}

export default Home