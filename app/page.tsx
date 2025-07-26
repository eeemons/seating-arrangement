"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, RotateCcw, Users, Edit3, Trash2, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Seat {
  id: string;
  name: string;
  x: number;
  y: number;
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
  const [seatCount, setSeatCount] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [isDraggingMultiple, setIsDraggingMultiple] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [multiDragOffsets, setMultiDragOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [editName, setEditName] = useState('');
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Save state to history
  const saveToHistory = useCallback((newSeats: Seat[]) => {
    const newHistoryState: HistoryState = {
      seats: JSON.parse(JSON.stringify(newSeats)),
      timestamp: Date.now()
    };
    
    setHistory(prev => {
      // Remove any future history if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newHistoryState);
      
      // Keep only last 50 states to prevent memory issues
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setSeats(previousState.seats);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const generateSeats = useCallback(() => {
    const newSeats: Seat[] = [];
    
    for (let i = 0; i < seatCount; i++) {
      // Arrange seats in a rough grid pattern initially
      const cols = Math.ceil(Math.sqrt(seatCount));
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      newSeats.push({
        id: `seat-${Date.now()}-${i}`,
        name: `Seat ${i + 1}`,
        x: 50 + col * 80,
        y: 50 + row * 70,
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

    // Handle selection
    if (e.ctrlKey) {
      toggleSeatSelection(seatId, true);
    } else if (!isCurrentSeatSelected) {
      toggleSeatSelection(seatId, false);
    }

    // Handle dragging
    if (selectedSeats.length > 1 && isCurrentSeatSelected) {
      // Multi-seat drag
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
      // Single seat drag
      setIsDragging(seatId);
      setDragOffset({
        x: e.clientX - containerRect.left - seat.x,
        y: e.clientY - containerRect.top - seat.y,
      });
    }
    
    // Prevent text selection during drag
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

      // Update seat selection based on selection box
      const minX = Math.min(selectionBox.startX, endX);
      const maxX = Math.max(selectionBox.startX, endX);
      const minY = Math.min(selectionBox.startY, endY);
      const maxY = Math.max(selectionBox.startY, endY);

      setSeats(prev => prev.map(seat => {
        const seatCenterX = seat.x + 25; // Half of seat width
        const seatCenterY = seat.y + 20; // Half of seat height
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
    // Save to history when drag ends
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

  const selectedCount = getSelectedSeats().length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
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
                  Number of seats:
                </Label>
                <Input
                  id="seatCount"
                  type="number"
                  min="1"
                  max="50"
                  value={seatCount}
                  onChange={(e) => setSeatCount(parseInt(e.target.value) || 1)}
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
                    transform: (isDragging === seat.id || (isDraggingMultiple && seat.selected)) ? 'translateZ(0)' : undefined,
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
            <li>Click on empty space (without Ctrl) to clear selection</li>
            <li>Use the <strong>Undo</strong> button to revert recent changes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}