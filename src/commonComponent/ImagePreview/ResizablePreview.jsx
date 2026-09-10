import React, { useState, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Props:
 *  open: boolean
 *  onClose: function
 *  src: image url
 *  alt: image alt
 */
const MIN_IMG_W = 100;
const MIN_IMG_H = 100;
const MAX_IMG_W = Math.floor(window.innerWidth * 0.9);
const MAX_IMG_H = Math.floor(window.innerHeight * 0.9);
const TITLEBAR_HEIGHT = 56;
const ResizablePreview = ({ open, onClose, src, alt }) => {

    // Dynamically calculate max width/height
    const getMaxDims = () => ({
        w: Math.floor(window.innerWidth * 0.9),
        h: Math.floor(window.innerHeight * 0.9) - TITLEBAR_HEIGHT,
    });
    // initial image size
    const [imgSize, setImgSize] = useState({ width: 400, height: 300 });
    const [maxDims, setMaxDims] = useState(getMaxDims());
    const resizeDirRef = useRef(null);
    const startSizeRef = useRef({ w: 0, h: 0, x: 0, y: 0 });

    React.useEffect(() => {
        const handleResize = () => setMaxDims(getMaxDims());
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    // Handles for resizing image
    const handleResizeStart = (dir) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        resizeDirRef.current = dir;
        startSizeRef.current = {
            w: imgSize.width,
            h: imgSize.height,
            x: e.clientX,
            y: e.clientY
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
    const { w, h, x, y } = startSizeRef.current;
    let newW = w, newH = h;
    const dx = e.clientX - x;
    const dy = e.clientY - y;
    switch (resizeDirRef.current) {
      case 'br': newW = w + dx; newH = h + dy; break;
      case 'bl': newW = w - dx; newH = h + dy; break;
      case 'tr': newW = w + dx; newH = h - dy; break;
      case 'tl': newW = w - dx; newH = h - dy; break;
      default: break;
    }
    setImgSize({
      width: Math.max(100, Math.min(maxDims.w, newW)),
      height: Math.max(100, Math.min(maxDims.h, newH)),
    });
  };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        resizeDirRef.current = null;
    };

    // Optionally: Center dialog and make it non-resizable, or adjust as you wish.
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            PaperProps={{
                style: {
                    minWidth: 200,
                    minHeight: 150,
                    overflow: 'visible',
                }
            }}
        >
            <DialogTitle
                sx={{
                    m: 0, p: 3, fontSize: "14px",
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: '#f5f5f5',
                    position: 'relative',
                    userSelect: 'none',
                    zIndex: 20
                }}
            >

                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        right: 4,
                        top: 4,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent
                sx={{
                    padding: 2,
                    overflow: 'visible',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minWidth: 200,
                    minHeight: 150
                }}
            >
                <Box
                    sx={{
                        position: 'relative',
                        width: imgSize.width,
                        height: imgSize.height,
                        marginTop: 2, // No overlap with title
                        background: '#fafafa',
                        border: '1px solid #ddd',
                        borderRadius: 2,
                        boxShadow: '0 0 4px rgba(0,0,0,0.05)'
                    }}
                >
                    <img
                        src={src}
                        alt={alt}
                        style={{
                            width: imgSize.width,
                            height: imgSize.height,
                            objectFit: 'contain',
                            display: 'block',
                            pointerEvents: 'none', // prevents interfering with handle drag
                            userSelect: 'none',
                        }}
                        draggable={false}
                    />

                    {/* Four resize handles */}
                    {/* Bottom Right */}
                    <Box
                        sx={handleBoxStyle('br')}
                        onMouseDown={handleResizeStart('br')}
                    />
                    {/* Bottom Left */}
                    <Box
                        sx={handleBoxStyle('bl')}
                        onMouseDown={handleResizeStart('bl')}
                    />
                    {/* Top Right */}
                    <Box
                        sx={handleBoxStyle('tr')}
                        onMouseDown={handleResizeStart('tr')}
                    />
                    {/* Top Left */}
                    <Box
                        sx={handleBoxStyle('tl')}
                        onMouseDown={handleResizeStart('tl')}
                    />
                </Box>
            </DialogContent>
        </Dialog>
    );
};

function handleBoxStyle(dir) {
    // dir: "tl" | "tr" | "bl" | "br"
    let pos = {};
    if (dir.includes('t')) pos.top = -10;
    if (dir.includes('b')) pos.bottom = -10;
    if (dir.includes('l')) pos.left = -10;
    if (dir.includes('r')) pos.right = -10;
    let cursor = '';
    switch (dir) {
        case 'br': cursor = 'nwse-resize'; break;
        case 'tl': cursor = 'nwse-resize'; break;
        case 'tr': cursor = 'nesw-resize'; break;
        case 'bl': cursor = 'nesw-resize'; break;
        default: cursor = 'pointer';
    }
    return {
        position: 'absolute',
        width: 20,
        height: 20,
        backgroundColor: '#1976d2',
        border: '2px solid white',
        borderRadius: 2,
        zIndex: 10,
        boxShadow: '0 0 4px rgba(0,0,0,0.3)',
        cursor,
        ...pos,
    };
}

export default ResizablePreview;