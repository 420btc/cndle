import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, Text, Platform } from 'react-native';
import { Candle, Prediction } from '../types/candle';
import { Svg, Line, Rect, Text as SvgText, Circle, Path, G } from 'react-native-svg';
import { getHistoricalCandles } from '../api/binanceApi';

interface BettedCandle {
  timestamp: number;
  prediction: Prediction;
  isDoubleBet?: boolean;
}

interface TrendLine {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface CandleChartProps {
  candles: Candle[];
  currentCandle: Candle | null;
  highlightPattern?: { startIndex: number; endIndex: number };
  showLastCandle?: boolean;
  bettedCandles?: BettedCandle[];
  centerLastCandle?: boolean;
  xOffset?: number;
}

const CandleChart: React.FC<CandleChartProps> = ({ 
  candles, 
  currentCandle,
  highlightPattern,
  showLastCandle = false,
  bettedCandles = [],
  centerLastCandle = false,
  xOffset = 0
}) => {
  const [chartWidth, setChartWidth] = useState(Dimensions.get('window').width - 30);
  const [chartHeight, setChartHeight] = useState(320);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewOffset, setViewOffset] = useState(0); // moves one candle at a time
  const [extendedCandles, setExtendedCandles] = useState<Candle[]>([]);
  
  // Trend line drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);
  const [trendLines, setTrendLines] = useState<TrendLine[]>([]);
  const svgRef = useRef<View>(null);
  
  // Add state for EMA visibility
  const [showEMAs, setShowEMAs] = useState(true);
  
  // Fetch additional historical candles to calculate EMAs with more data points
  useEffect(() => {
    const fetchExtendedCandles = async () => {
      if (candles.length === 0) return;
      
      try {
        // Get 500 candles to have enough data for EMA-200 calculation
        const historicalCandles = await getHistoricalCandles('BTCUSDT', '1m', 500);
        
        // Merge with current candles to ensure real-time updates
        // First create a map of all historical candles
        const candleMap = new Map<number, Candle>();
        historicalCandles.forEach(candle => {
          candleMap.set(candle.timestamp, candle);
        });
        
        // Then add or update with current candles
        const allCandles = [...candles];
        if (currentCandle && !candles.some(c => c.timestamp === currentCandle.timestamp)) {
          allCandles.push(currentCandle);
        }
        
        allCandles.forEach(candle => {
          candleMap.set(candle.timestamp, candle);
        });
        
        // Convert back to array and sort by timestamp
        const mergedCandles = Array.from(candleMap.values())
          .sort((a, b) => a.timestamp - b.timestamp);
        
        setExtendedCandles(mergedCandles);
      } catch (error) {
        console.error('Failed to fetch extended candles:', error);
      }
    };
    
    fetchExtendedCandles();
  }, [candles.length > 0]); // Keep original dependency to avoid too many API calls
  
  // Update extended candles with current data without fetching from API
  useEffect(() => {
    if (extendedCandles.length === 0) return;
    
    // Create a map from existing extended candles
    const candleMap = new Map<number, Candle>();
    extendedCandles.forEach(candle => {
      candleMap.set(candle.timestamp, candle);
    });
    
    // Update with current candles
    const allCandles = [...candles];
    if (currentCandle && !candles.some(c => c.timestamp === currentCandle.timestamp)) {
      allCandles.push(currentCandle);
    }
    
    let hasUpdates = false;
    allCandles.forEach(candle => {
      // Only update if the candle is newer or has different data
      const existingCandle = candleMap.get(candle.timestamp);
      if (!existingCandle || 
          existingCandle.close !== candle.close || 
          existingCandle.high !== candle.high || 
          existingCandle.low !== candle.low) {
        candleMap.set(candle.timestamp, candle);
        hasUpdates = true;
      }
    });
    
    // Only update state if there were changes
    if (hasUpdates) {
      const updatedCandles = Array.from(candleMap.values())
        .sort((a, b) => a.timestamp - b.timestamp);
      setExtendedCandles(updatedCandles);
    }
  }, [candles, currentCandle]);
  
  // Merge current candle with list if not present, deduplicated
  const allCandles = (() => {
    if (!currentCandle) return candles;
    const exists = candles.some(candle => candle.timestamp === currentCandle.timestamp);
    return exists ? candles : [...candles, currentCandle];
  })();
  
  if (allCandles.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }
  
  // Determine min and max prices, add padding and compression
  const prices = allCandles.flatMap(candle => [candle.high, candle.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const compressionFactor = 1.4;
  const paddingAmount = priceRange * 0.01;
  const adjustedMinPrice = minPrice - paddingAmount;
  const adjustedMaxPrice = maxPrice + paddingAmount;
  const effectiveRange = (adjustedMaxPrice - adjustedMinPrice) * compressionFactor;
  const midPrice = (adjustedMaxPrice + adjustedMinPrice) / 2;
  const effectiveMinPrice = midPrice - effectiveRange / 2;
  const effectiveMaxPrice = midPrice + effectiveRange / 2;
  const effectivePriceRange = effectiveMaxPrice - effectiveMinPrice;
  
  // Get unique candles and ensure maximum of 100 for navigation
  const allUniqueCandles = (() => {
    const map = new Map<number, Candle>();
    allCandles.forEach(candle => map.set(candle.timestamp, candle));
    const unique = Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
    return unique.slice(-100);
  })();
  
  // Calculate how many candles to display based on zoom level
  const candlesPerView = Math.round(50 / zoomLevel);
  
  // Display candles based on viewOffset and candlesPerView
  const displayCandles = (() => {
    const startIndex = Math.max(0, allUniqueCandles.length - candlesPerView - viewOffset);
    const endIndex = startIndex + candlesPerView;
    return allUniqueCandles.slice(startIndex, endIndex);
  })();
  
  // Calculate candle width and spacing
  const candleWidth = (chartWidth / candlesPerView) * 0.6;
  const spacing = (chartWidth / candlesPerView) * 0.4;
  
  const priceToY = (price: number) => {
    return chartHeight - ((price - effectiveMinPrice) / effectivePriceRange) * chartHeight;
  };
  
  let calculatedXOffset = xOffset;
  if (centerLastCandle && displayCandles.length > 0 && xOffset === 0) {
    const lastCandleX = (displayCandles.length - 1) * (candleWidth + spacing) + spacing / 2;
    const centerX = chartWidth / 2 - candleWidth / 2;
    calculatedXOffset = centerX - lastCandleX;
    const maxOffset = 0;
    const minOffset = chartWidth - (displayCandles.length * (candleWidth + spacing));
    calculatedXOffset = Math.min(maxOffset, Math.max(minOffset, calculatedXOffset));
  }
  
  const isBettedCandle = (timestamp: number) => {
    const uniqueBets = bettedCandles.filter((bet, i, self) => i === self.findIndex(b => b.timestamp === bet.timestamp));
    return uniqueBets.some(bet => bet.timestamp === timestamp);
  };
  
  const getBetPrediction = (timestamp: number): Prediction | null => {
    const bets = bettedCandles.filter(bet => bet.timestamp === timestamp);
    return bets.length > 0 ? bets[0].prediction : null;
  };
  
  const isDoubleBet = (timestamp: number): boolean => {
    const bets = bettedCandles.filter(bet => bet.timestamp === timestamp);
    return bets.length > 0 ? !!bets[0].isDoubleBet : false;
  };
  
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
  };
  
  // Fixed EMA calculation function
  const calculateEMA = (data: Candle[], period: number = 10): number[] => {
    if (data.length < period) return [];
    
    const ema: number[] = [];
    const k = 2 / (period + 1);
    
    // Calculate first EMA value (SMA)
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i].close;
    }
    const firstEMA = sum / period;
    ema.push(firstEMA);
    
    // Calculate subsequent EMA values using the correct formula
    for (let i = period; i < data.length; i++) {
      // Use the previous EMA value (not the one from period steps back)
      const currentEMA = data[i].close * k + ema[ema.length - 1] * (1 - k);
      ema.push(currentEMA);
    }
    
    return ema;
  };
  
  // Generate EMA lines for all periods
  const generateEMALine = (period: number, color: string) => {
    if (extendedCandles.length < period) return null;
    
    const emaValues = calculateEMA(extendedCandles, period);
    if (emaValues.length === 0) return null;
    
    // Map the EMA values to the visible candles
    const path = displayCandles.reduce((pathString, candle, index) => {
      // Find the index of this candle in the extended candles array
      const extendedIndex = extendedCandles.findIndex(c => c.timestamp === candle.timestamp);
      
      // Calculate the corresponding EMA index
      // The first EMA value is at index period-1 in the original data
      const emaIndex = extendedIndex - period;
      
      // If we have a valid EMA value for this candle
      if (emaIndex >= 0 && emaIndex < emaValues.length) {
        const x = index * (candleWidth + spacing) + spacing / 2 + calculatedXOffset + candleWidth / 2;
        const y = priceToY(emaValues[emaIndex]);
        return pathString + (pathString === "" ? `M ${x},${y} ` : `L ${x},${y} `);
      }
      return pathString;
    }, "");
    
    return path ? <Path d={path} stroke={color} strokeWidth={1} fill="none" /> : null;
  };
  
  // Zoom controls with smaller increments
  const handleZoomIn = () => {
    if (zoomLevel < 3) setZoomLevel(prev => Math.min(3, prev + 0.25));
  };

  const handleZoomOut = () => {
    if (zoomLevel > 0.5) setZoomLevel(prev => Math.max(0.5, prev - 0.25));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Navigation: Move one candle at a time
  const handleNavigatePast = () => {
    const maxOffset = Math.max(0, allUniqueCandles.length - candlesPerView);
    setViewOffset(prev => Math.min(maxOffset, prev + 1));
  };
  
  const handleNavigateFuture = () => {
    setViewOffset(prev => Math.max(0, prev - 1));
  };
  
  const canNavigatePast = viewOffset < allUniqueCandles.length - candlesPerView;
  const canNavigateFuture = viewOffset > 0;
  
  // Trend line drawing functions
  const toggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
    if (isDrawing) {
      setIsDrawing(false);
      setCurrentLine(null);
    }
  };

  // Add toggle function for EMAs
  const toggleEMAs = () => {
    setShowEMAs(!showEMAs);
  };

  const clearAllTrendLines = () => {
    setTrendLines([]);
  };

  const getCoordinatesFromEvent = (event: any) => {
    if (!svgRef.current) return null;
    
    // Get touch coordinates relative to SVG
    const svgElement = svgRef.current;
    
    // For web
    if (Platform.OS === 'web') {
      const rect = (event.target as SVGElement).getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    } 
    // For mobile
    else {
      const touch = event.nativeEvent.touches[0] || event.nativeEvent.changedTouches[0];
      const rect = svgElement.getBoundingClientRect?.() || { left: 0, top: 0 };
      return {
        x: touch.pageX - rect.left,
        y: touch.pageY - rect.top
      };
    }
  };

  const handleTouchStart = (event: any) => {
    if (!isDrawingMode) return;
    
    const coords = getCoordinatesFromEvent(event);
    if (!coords) return;
    
    setIsDrawing(true);
    setCurrentLine({
      startX: coords.x,
      startY: coords.y,
      endX: coords.x,
      endY: coords.y
    });
  };

  const handleTouchMove = (event: any) => {
    if (!isDrawingMode || !isDrawing || !currentLine) return;
    
    const coords = getCoordinatesFromEvent(event);
    if (!coords) return;
    
    setCurrentLine({
      ...currentLine,
      endX: coords.x,
      endY: coords.y
    });
  };

  const handleTouchEnd = () => {
    if (!isDrawingMode || !isDrawing || !currentLine) return;
    
    // Only add the line if it has some length
    const length = Math.sqrt(
      Math.pow(currentLine.endX - currentLine.startX, 2) + 
      Math.pow(currentLine.endY - currentLine.startY, 2)
    );
    
    if (length > 10) {
      // Store the line with its original coordinates
      setTrendLines([
        ...trendLines,
        {
          id: Date.now().toString(),
          startX: currentLine.startX,
          startY: currentLine.startY,
          endX: currentLine.endX,
          endY: currentLine.endY
        }
      ]);
    }
    
    setIsDrawing(false);
    setCurrentLine(null);
  };

  // Determine if we're on web or mobile for event handlers
  const touchProps = Platform.OS === 'web' 
    ? {
        onMouseDown: handleTouchStart,
        onMouseMove: handleTouchMove,
        onMouseUp: handleTouchEnd,
        onMouseLeave: handleTouchEnd
      } 
    : {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd
      };
  
  return (
    <View style={styles.container} onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
      <Svg 
        width={chartWidth} 
        height={chartHeight} 
        ref={svgRef}
        {...(isDrawingMode ? touchProps : {})}
      >
        {[0.25, 0.5, 0.75].map((ratio, index) => {
          const y = chartHeight * ratio;
          const price = effectiveMaxPrice - (effectivePriceRange * ratio);
          return (
            <React.Fragment key={`grid-${index}`}>
              <Line x1={0} y1={y} x2={chartWidth} y2={y} stroke="#333" strokeWidth={0.5} strokeDasharray="5,5" />
              <SvgText x={5} y={y - 5} fill="#ffffff" fontSize={10} opacity={0.7}>
                ${price.toFixed(1)}
              </SvgText>
            </React.Fragment>
          );
        })}
        
        {/* Render all EMAs using the new generateEMALine function */}
        {showEMAs && (
          <>
            {generateEMALine(10, "#f7931a")}
            {generateEMALine(55, "#9333ea")}
            {generateEMALine(200, "#3b82f6")}
          </>
        )}
        
        {displayCandles.map((candle, index) => {
          const x = index * (candleWidth + spacing) + spacing / 2 + calculatedXOffset;
          if (x + candleWidth < 0 || x > chartWidth) return null;
          const open = priceToY(candle.open);
          const close = priceToY(candle.close);
          const high = priceToY(candle.high);
          const low = priceToY(candle.low);
          const isBullish = candle.close > candle.open;
          const candleColor = isBullish ? '#16a34a' : '#dc2626';
          const isHighlighted = highlightPattern && index >= highlightPattern.startIndex && index <= highlightPattern.endIndex;
          const isCurrentCandle = (currentCandle && candle.timestamp === currentCandle.timestamp) ||
                                   (index === displayCandles.length - 1 && !candle.isClosed && viewOffset === 0);
          const hasBet = isBettedCandle(candle.timestamp);
          const betPrediction = getBetPrediction(candle.timestamp);
          const hasDoubleBet = isDoubleBet(candle.timestamp);
          const betMarkerColor = betPrediction === 'bull' ? '#16a34a' : '#dc2626';
          const betMarkerEmoji = betPrediction === 'bull' ? '🐂' : '🐻';
          
          return (
            <React.Fragment key={`candle-${candle.timestamp}-${index}`}>
              {index % 5 === 0 && (
                <SvgText x={x + candleWidth / 2} y={chartHeight - 5} fill="#ffffff" fontSize={8} textAnchor="middle" opacity={0.7}>
                  {formatTimestamp(candle.timestamp)}
                </SvgText>
              )}
              <Line x1={x + candleWidth / 2} y1={high} x2={x + candleWidth / 2} y2={low} stroke={candleColor} strokeWidth={1.5} />
              <Rect x={x} y={Math.min(open, close)} width={candleWidth} height={Math.max(Math.abs(close - open), 1)}
                fill={candleColor} stroke={isHighlighted ? '#f59e0b' : candleColor} strokeWidth={isHighlighted ? 2 : 1}
                opacity={isCurrentCandle ? 0.7 : 1} />
              {isCurrentCandle && (
                <Rect x={x - 2} y={Math.min(open, close) - 2} width={candleWidth + 4} height={Math.abs(close - open) + 4 || 5}
                  fill="none" stroke="#ffffff" strokeWidth={1} strokeDasharray="3,3" />
              )}
              {hasBet && (
                <>
                  {hasDoubleBet ? (
                    <>
                      <Circle cx={x + candleWidth / 2} cy={high - 15} r={6} fill={betMarkerColor} stroke="#ffffff" strokeWidth={1} />
                      <SvgText x={x + candleWidth / 2} y={high - 12} fill="#ffffff" fontSize={8} textAnchor="middle" fontWeight="bold">
                        {betMarkerEmoji}
                      </SvgText>
                      <Circle cx={x + candleWidth / 2} cy={high - 28} r={6} fill={betMarkerColor} stroke="#ffffff" strokeWidth={1} />
                      <SvgText x={x + candleWidth / 2} y={high - 25} fill="#ffffff" fontSize={8} textAnchor="middle" fontWeight="bold">
                        {betMarkerEmoji}
                      </SvgText>
                    </>
                  ) : (
                    <>
                      <Circle cx={x + candleWidth / 2} cy={high - 15} r={6} fill={betMarkerColor} stroke="#ffffff" strokeWidth={1} />
                      <SvgText x={x + candleWidth / 2} y={high - 12} fill="#ffffff" fontSize={8} textAnchor="middle" fontWeight="bold">
                        {betMarkerEmoji}
                      </SvgText>
                    </>
                  )}
                </>
              )}
            </React.Fragment>
          );
        })}
        
        {/* Render saved trend lines */}
        {trendLines.map(line => (
          <G key={line.id} onPress={() => setTrendLines(trendLines.filter(l => l.id !== line.id))}>
            <Line
              x1={line.startX}
              y1={line.startY}
              x2={line.endX}
              y2={line.endY}
              stroke="#ffcc00"
              strokeWidth={2}
            />
          </G>
        ))}
        
        {/* Render current drawing line */}
        {isDrawingMode && isDrawing && currentLine && (
          <Line
            x1={currentLine.startX}
            y1={currentLine.startY}
            x2={currentLine.endX}
            y2={currentLine.endY}
            stroke="#ffcc00"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        )}
      </Svg>
      
      {/* Navigation controls with EMA toggle in the middle */}
      <View style={styles.leftControlsContainer}>
        <View style={styles.navigationControls}>
          <TouchableOpacity 
            style={[styles.navButton, !canNavigatePast && styles.disabledButton]} 
            onPress={handleNavigatePast}
            disabled={!canNavigatePast}
          >
            <Text style={styles.navButtonText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.navButton, !canNavigateFuture && styles.disabledButton]} 
            onPress={handleNavigateFuture}
            disabled={!canNavigateFuture}
          >
            <Text style={styles.navButtonText}>→</Text>
          </TouchableOpacity>
          {/* EMA toggle button moved here */}
          <TouchableOpacity 
            style={[styles.navButton, !showEMAs && styles.emaButtonInactive]} 
            onPress={toggleEMAs}
          >
            <Text style={styles.navButtonText}>📊</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.rightControlsContainer}>
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
            <Text style={styles.zoomButtonText}>-</Text>
          </TouchableOpacity>
          {/* Drawing button */}
          <TouchableOpacity 
            style={[styles.zoomButton, isDrawingMode && styles.drawButtonActive]} 
            onPress={toggleDrawingMode}
          >
            <Text style={styles.zoomButtonText}>📈</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
            <Text style={styles.zoomButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Show trash (clear all) button above when in drawing mode */}
      {isDrawingMode && (
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={clearAllTrendLines}
        >
          <Text style={styles.drawButtonText}>🗑️</Text>
        </TouchableOpacity>
      )}
      
      {/* Drawing mode indicator */}
      {isDrawingMode && (
        <View style={styles.drawingModeIndicator}>
          <Text style={styles.drawingModeText}>
            {isDrawing ? 'Dibujando línea...' : 'Toca para dibujar línea de tendencia'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 8,
    marginVertical: 2,
    height: 320,
    marginHorizontal: 0,
    position: 'relative',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Left controls container (navigation)
  leftControlsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    zIndex: 10,
  },
  // Right controls container (zoom)
  rightControlsContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    zIndex: 10,
  },
  navigationControls: {
    flexDirection: 'row',
  },
  zoomControls: {
    flexDirection: 'row',
  },
  navButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  disabledButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    opacity: 0.5,
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  zoomButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  resetButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  zoomButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Trend line drawing styles - Removed drawButton style since it's now part of zoomControls
  drawButtonActive: {
    backgroundColor: 'rgba(255, 204, 0, 0.7)',
  },
  // EMA button inactive style
  emaButtonInactive: {
    backgroundColor: 'rgba(100, 100, 100, 0.7)',
  },
  // Trash button moved to top position
  clearButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  drawButtonText: {
    fontSize: 16,
  },
  drawingModeIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
    padding: 4,
    zIndex: 10,
  },
  drawingModeText: {
    color: '#ffffff',
    fontSize: 10,
  }
});

export default CandleChart;
