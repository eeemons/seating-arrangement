"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, RotateCcw, Users, Edit3, Trash2, GripVertical, RotateCw, AlignVerticalJustifyStart, AlignHorizontalJustifyStart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu';

interface Seat {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  selected?: boolean;
}

interface HistoryState {
  seats: Seat[];
  timestamp: number;
}

export default function SeatingArrangement() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [seatCount, setSeatCount] = useState<string>("1");
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [isDraggingMultiple, setIsDraggingMultiple] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [multiDragOffsets, setMultiDragOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [editName, setEditName] = useState('');
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const saveToHistory = useCallback((newSeats: Seat[]) => {
    const newHistoryState: HistoryState = {
      seats: JSON.parse(JSON.stringify(newSeats)),
      timestamp: Date.now()
    };
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newHistoryState);
      
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setSeats(previousState.seats);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const generateSeats = useCallback(() => {
    const numSeats = parseInt(seatCount, 10);
    if (isNaN(numSeats) || numSeats <= 0) return;

    const newSeats: Seat[] = [];
    const existingSeatCount = seats.length;
    
    for (let i = 0; i < numSeats; i++) {
      const totalIndex = existingSeatCount + i;
      const cols = Math.ceil(Math.sqrt(numSeats + existingSeatCount));
      const row = Math.floor(totalIndex / cols);
      const col = totalIndex % cols;
      
      newSeats.push({
        id: `seat-${Date.now()}-${i}`,
        name: `Seat ${totalIndex + 1}`,
        x: 50 + col * 80,
        y: 50 + row * 70,
        rotation: 0,
        selected: false,
      });
    }
    
    const updatedSeats = [...seats, ...newSeats];
    setSeats(updatedSeats);
    saveToHistory(updatedSeats);
  }, [seatCount, seats, saveToHistory]);

  const toggleSeatSelection = (seatId: string, ctrlKey: boolean) => {
    setSeats(prev => prev.map(seat => {
      if (seat.id === seatId) {
        return { ...seat, selected: ctrlKey ? !seat.selected : true };
      } else if (!ctrlKey) {
        return { ...seat, selected: false };
      }
      return seat;
    }));
  };

  const clearSelection = () => {
    setSeats(prev => prev.map(seat => ({ ...seat, selected: false })));
  };

  const getSelectedSeats = () => seats.filter(seat => seat.selected);

  const handleMouseDown = (e: React.MouseEvent, seatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const seat = seats.find(s => s.id === seatId);
    if (!seat) return;

    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (!containerRect) return;

    const selectedSeats = getSelectedSeats();
    const isCurrentSeatSelected = seat.selected;

    if (e.ctrlKey) {
      toggleSeatSelection(seatId, true);
    } else if (!isCurrentSeatSelected) {
      toggleSeatSelection(seatId, false);
    }

    if (selectedSeats.length > 1 && isCurrentSeatSelected) {
      setIsDraggingMultiple(true);
      const offsets: Record<string, { x: number; y: number }> = {};
      selectedSeats.forEach(selectedSeat => {
        offsets[selectedSeat.id] = {
          x: e.clientX - containerRect.left - selectedSeat.x,
          y: e.clientY - containerRect.top - selectedSeat.y,
        };
      });
      setMultiDragOffsets(offsets);
    } else {
      setIsDragging(seatId);
      setDragOffset({
        x: e.clientX - containerRect.left - seat.x,
        y: e.clientY - containerRect.top - seat.y,
      });
    }
    
    document.body.style.userSelect = 'none';
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      if (!e.ctrlKey) {
        clearSelection();
      }

      setIsSelecting(true);
      const startX = e.clientX - containerRect.left;
      const startY = e.clientY - containerRect.top;
      setSelectionBox({ startX, startY, endX: startX, endY: startY });
      document.body.style.userSelect = 'none';
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    if (isSelecting && selectionBox) {
      const endX = e.clientX - containerRect.left;
      const endY = e.clientY - containerRect.top;
      setSelectionBox(prev => prev ? { ...prev, endX, endY } : null);

      const minX = Math.min(selectionBox.startX, endX);
      const maxX = Math.max(selectionBox.startX, endX);
      const minY = Math.min(selectionBox.startY, endY);
      const maxY = Math.max(selectionBox.startY, endY);

      setSeats(prev => prev.map(seat => {
        const seatCenterX = seat.x + 25;
        const seatCenterY = seat.y + 20;
        const isInSelection = seatCenterX >= minX && seatCenterX <= maxX && 
                             seatCenterY >= minY && seatCenterY <= maxY;
        return { ...seat, selected: isInSelection };
      }));
      return;
    }

    if (isDraggingMultiple) {
      e.preventDefault();
      const selectedSeats = getSelectedSeats();
      
      setSeats(prev => prev.map(seat => {
        if (seat.selected && multiDragOffsets[seat.id]) {
          const offset = multiDragOffsets[seat.id];
          const newX = Math.max(0, e.clientX - containerRect.left - offset.x);
          const newY = Math.max(0, e.clientY - containerRect.top - offset.y);
          return { ...seat, x: newX, y: newY };
        }
        return seat;
      }));
      return;
    }

    if (!isDragging) return;

    e.preventDefault();
    const newX = Math.max(0, e.clientX - containerRect.left - dragOffset.x);
    const newY = Math.max(0, e.clientY - containerRect.top - dragOffset.y);

    setSeats(prev => prev.map(seat => 
      seat.id === isDragging 
        ? { ...seat, x: newX, y: newY }
        : seat
    ));
  }, [isDragging, isDraggingMultiple, isSelecting, dragOffset, multiDragOffsets, selectionBox]);

  const handleMouseUp = useCallback(() => {
    if (isDragging || isDraggingMultiple) {
      saveToHistory(seats);
    }
    
    setIsSelecting(false);
    setSelectionBox(null);
    setIsDragging(null);
    setIsDraggingMultiple(false);
    setDragOffset({ x: 0, y: 0 });
    setMultiDragOffsets({});
    document.body.style.userSelect = '';
  }, [isDragging, isDraggingMultiple, seats, saveToHistory]);

  useEffect(() => {
    if (isDragging || isDraggingMultiple || isSelecting) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, isDraggingMultiple, isSelecting, handleMouseMove, handleMouseUp]);

  const deleteSeat = (seatId: string) => {
    const updatedSeats = seats.filter(seat => seat.id !== seatId);
    setSeats(updatedSeats);
    saveToHistory(updatedSeats);
  };

  const deleteSelectedSeats = () => {
    const updatedSeats = seats.filter(seat => !seat.selected);
    setSeats(updatedSeats);
    saveToHistory(updatedSeats);
  };

  const openEditDialog = (seat: Seat) => {
    setEditingSeat(seat);
    setEditName(seat.name);
  };

  const saveEditedSeat = () => {
    if (!editingSeat) return;
    
    const updatedSeats = seats.map(seat => 
      seat.id === editingSeat.id 
        ? { ...seat, name: editName }
        : seat
    );
    
    setSeats(updatedSeats);
    saveToHistory(updatedSeats);
    
    setEditingSeat(null);
    setEditName('');
  };

  const resetLayout = () => {
    const emptySeats: Seat[] = [];
    setSeats(emptySeats);
    saveToHistory(emptySeats);
    setHistory([]);
    setHistoryIndex(-1);
  };

  const rotateSelectedSeats = (direction: 'left' | 'right') => {
    const updatedSeats = seats.map(seat => {
      if (seat.selected) {
        return { ...seat, rotation: seat.rotation + (direction === 'left' ? -90 : 90) };
      }
      return seat;
    });
    setSeats(updatedSeats);
    saveToHistory(updatedSeats);
  };

  const alignSelectedSeats = (direction: 'vertical' | 'horizontal') => {
    const selectedSeats = getSelectedSeats();
    if (selectedSeats.length < 2) return;

    const firstSelected = selectedSeats[0];
    const updatedSeats = seats.map(seat => {
      if (seat.selected) {
        if (direction === 'vertical') {
          return { ...seat, x: firstSelected.x };
        } else {
          return { ...seat, y: firstSelected.y };
        }
      }
      return seat;
    });
    setSeats(updatedSeats);
    saveToHistory(updatedSeats);
  };

  const handleSeatCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setSeatCount(value);
    }
  };

  const selectedCount = getSelectedSeats().length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <Users className="h-10 w-10 text-blue-600" />
            Seating Arrangement Designer
          </h1>
          <p className="text-slate-600 text-lg">Create and customize your perfect seating layout</p>
        </div>

        {/* Controls */}
        <Card className="mb-6 shadow-lg border-0 bg-white">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="seatCount" className="text-sm font-medium text-slate-700">
                  Number of seats to add:
                </Label>
                <Input
                  id="seatCount"
                  type="text"
                  value={seatCount}
                  onChange={handleSeatCountChange}
                  className="w-20 h-10"
                />
              </div>
              
              <Button 
                onClick={generateSeats}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Seats
              </Button>
              
              <Button 
                onClick={undo}
                disabled={historyIndex <= 0}
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50 px-6 h-10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Undo
              </Button>
              
              <Button 
                onClick={resetLayout}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 px-6 h-10"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Layout
              </Button>
              
              {selectedCount > 0 && (
                <Button 
                  onClick={deleteSelectedSeats}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 px-6 h-10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedCount})
                </Button>
              )}
              
              <Badge variant="secondary" className="ml-auto text-base px-4 py-2">
                Total Seats: {seats.length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Seating Layout Area */}
        <ContextMenu>
          <ContextMenuTrigger>
            <Card className="shadow-xl border-0 bg-white overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-slate-800 text-white p-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <GripVertical className="h-5 w-5" />
                    Drag seats to arrange your layout
                  </h2>
                </div>
                
                <div 
                  ref={containerRef}
                  className="relative bg-slate-50 h-[600px] overflow-auto border-2 border-dashed border-slate-200 touch-none"
                  style={{ cursor: isDragging || isDraggingMultiple ? 'grabbing' : 'default' }}
                  onMouseDown={handleContainerMouseDown}
                >
                  {/* Selection Box */}
                  {selectionBox && (
                    <div
                      className="absolute border-2 border-blue-400 bg-blue-100 bg-opacity-30 pointer-events-none z-40"
                      style={{
                        left: Math.min(selectionBox.startX, selectionBox.endX),
                        top: Math.min(selectionBox.startY, selectionBox.endY),
                        width: Math.abs(selectionBox.endX - selectionBox.startX),
                        height: Math.abs(selectionBox.endY - selectionBox.startY),
                      }}
                    />
                  )}
                  
                  {seats.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-slate-400">
                        <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No seats added yet</p>
                        <p>Add some seats to start designing your layout</p>
                      </div>
                    </div>
                  )}
                  
                  {seats.map((seat) => (
                    <div
                      key={seat.id}
                      className={`absolute select-none will-change-transform ${
                        isDragging === seat.id || (isDraggingMultiple && seat.selected)
                          ? 'z-50 scale-105 shadow-xl cursor-grabbing transition-none' 
                          : 'cursor-grab hover:scale-102 hover:shadow-md transition-all duration-150 ease-out'
                      }`}
                      style={{
                        left: seat.x,
                        top: seat.y,
                        transform: `rotate(${seat.rotation}deg)`,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, seat.id)}
                    >
                      <Card className={`w-16 h-14 ${
                        seat.selected
                          ? 'bg-blue-100 border-blue-400 border-2'
                          : isDragging === seat.id || (isDraggingMultiple && seat.selected)
                          ? 'bg-blue-100 border-blue-400 border-2' 
                          : 'bg-white border-slate-200 hover:border-blue-300'
                      }`}>
                        <CardContent className="p-1 h-full flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <GripVertical className="h-2 w-2 text-slate-400" />
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(seat);
                                }}
                                className="text-slate-400 hover:text-blue-600 transition-colors"
                              >
                                <Edit3 className="h-2 w-2" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSeat(seat.id);
                                }}
                                className="text-slate-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="h-2 w-2" />
                              </button>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-medium text-slate-700 truncate leading-tight">
                              {seat.name}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => rotateSelectedSeats('left')} disabled={selectedCount === 0}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Rotate Left
            </ContextMenuItem>
            <ContextMenuItem onClick={() => rotateSelectedSeats('right')} disabled={selectedCount === 0}>
              <RotateCw className="h-4 w-4 mr-2" />
              Rotate Right
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => alignSelectedSeats('vertical')} disabled={selectedCount < 2}>
              <AlignVerticalJustifyStart className="h-4 w-4 mr-2" />
              Align Vertical
            </ContextMenuItem>
            <ContextMenuItem onClick={() => alignSelectedSeats('horizontal')} disabled={selectedCount < 2}>
              <AlignHorizontalJustifyStart className="h-4 w-4 mr-2" />
              Align Horizontal
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {/* Edit Dialog */}
        <Dialog open={!!editingSeat} onOpenChange={() => setEditingSeat(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Seat Name</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="seatName" className="text-sm font-medium">
                  Seat Name
                </Label>
                <Input
                  id="seatName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter seat name..."
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingSeat(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveEditedSeat}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Instructions */}
        <div className="mt-4 text-sm text-slate-600 bg-white p-4 rounded-lg shadow">
          <p><strong>Multi-select tips:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Hold <kbd className="px-1 py-0.5 bg-slate-200 rounded text-xs">Ctrl</kbd> and click seats to select multiple</li>
            <li>Click and drag on empty space to select seats with a selection box</li>
            <li>Drag any selected seat to move all selected seats together</li>
            <li>Right-click on the seating area to open the context menu</li>
            <li>Use the <strong>Undo</strong> button to revert recent changes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}