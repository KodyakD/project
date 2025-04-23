import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import type { FloorMapEvacuationRoute } from '@/services/floorMapService';

interface RouteVisualizerProps {
  routes: FloorMapEvacuationRoute[];
  scale: number;
  selectedRouteId?: string;
  onRoutePress?: (route: FloorMapEvacuationRoute) => void;
}

const RouteVisualizer: React.FC<RouteVisualizerProps> = ({
  routes,
  scale,
  selectedRouteId,
  onRoutePress
}) => {
  if (!routes || routes.length === 0) {
    return null;
  }

  // Generate SVG path string from route points
  const generatePathString = (points: Array<{ x: number; y: number }>): string => {
    if (!points || points.length === 0) return '';
    
    // Start with the first point
    let pathString = `M ${points[0].x} ${points[0].y}`;
    
    // Add line segments to remaining points
    for (let i = 1; i < points.length; i++) {
      pathString += ` L ${points[i].x} ${points[i].y}`;
    }
    
    return pathString;
  };

  // Get route style based on priority
  const getRouteStyle = (route: FloorMapEvacuationRoute, isSelected: boolean) => {
    let strokeColor: string;
    let strokeWidth: number;
    let dashArray: string | undefined;
    
    // Assign style based on priority
    switch (route.priority) {
      case 1: // Primary route
        strokeColor = '#3b82f6'; // blue
        strokeWidth = 4;
        break;
      case 2: // Secondary route
        strokeColor = '#60a5fa';
        strokeWidth = 3;
        dashArray = '4,2';
        break;
      case 3: // Tertiary route
        strokeColor = '#93c5fd';
        strokeWidth = 2.5;
        dashArray = '2,2';
        break;
      default: // Fallback
        strokeColor = '#bfdbfe';
        strokeWidth = 2;
        dashArray = '1,1';
    }
    
    // Highlight selected route
    if (isSelected) {
      strokeColor = '#2563eb';
      strokeWidth += 1.5;
    }
    
    return {
      stroke: strokeColor,
      strokeWidth: strokeWidth * scale,
      dashArray
    };
  };
  
  return (
    <View style={styles.container} pointerEvents="box-none">
      <Svg style={StyleSheet.absoluteFill}>
        {routes.map(route => {
          const pathString = generatePathString(route.points);
          const isSelected = route.id === selectedRouteId;
          const style = getRouteStyle(route, isSelected);
          
          // Calculate arrow positions for route direction
          const arrows = [];
          if (route.points.length >= 2) {
            // Add an arrow at the midpoint
            const midIndex = Math.floor(route.points.length / 2);
            if (midIndex > 0) {
              const p1 = route.points[midIndex - 1];
              const p2 = route.points[midIndex];
              arrows.push({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
            }
            
            // Add an arrow near the end
            if (route.points.length > 3) {
              const endIndex = route.points.length - 2;
              const p1 = route.points[endIndex];
              const p2 = route.points[endIndex + 1];
              arrows.push({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
            }
          }
          
          return (
            <React.Fragment key={route.id}>
              <Path
                d={pathString}
                fill="none"
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={style.dashArray}
                onPress={() => onRoutePress && onRoutePress(route)}
              />
              
              {/* Route endpoint markers */}
              {route.points.length > 0 && (
                <>
                  {/* Start point */}
                  <Circle
                    cx={route.points[0].x}
                    cy={route.points[0].y}
                    r={4 * scale}
                    fill={style.stroke}
                  />
                  
                  {/* End point */}
                  <Circle
                    cx={route.points[route.points.length - 1].x}
                    cy={route.points[route.points.length - 1].y}
                    r={6 * scale}
                    fill="#059669"
                    stroke="white"
                    strokeWidth={1 * scale}
                  />
                </>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  }
});

export default RouteVisualizer; 