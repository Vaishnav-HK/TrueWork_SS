import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import Svg, {
  Circle,
  Line,
  G,
  TSpan,
  Text as SvgText,
  Rect,
} from "react-native-svg";

interface NetworkVisualizationProps {
  nodes: {
    id: number;
    student_id: string;
    filename: string;
  }[];
  edges: {
    studentPair: [number, number];
    semanticSimilarity: number;
    suspicionLevel: "low" | "medium" | "high" | "critical";
  }[];
  showPercentages?: boolean;
  showLowSimilarity?: boolean;
}

const getEdgeColor = (
  suspicionLevel: "low" | "medium" | "high" | "critical",
  similarity: number,
): string => {
  if (suspicionLevel === "critical" || similarity > 0.8) return "#dc3545"; // Red
  if (suspicionLevel === "high" || similarity > 0.6) return "#fd7e14"; // Orange
  if (suspicionLevel === "medium" || similarity > 0.4) return "#ffc107"; // Yellow
  return "#28a745"; // Green
};

const getEdgeLabel = (similarity: number): string => {
  return `${(similarity * 100).toFixed(0)}%`;
};

// Improved layout algorithm for better spacing
const generateNodePositions = (
  nodeCount: number,
  svgWidth: number,
  svgHeight: number,
): { [key: number]: { x: number; y: number } } => {
  const positions: { [key: number]: { x: number; y: number } } = {};
  const padding = 60;
  const usableWidth = svgWidth - padding * 2;
  const usableHeight = svgHeight - padding * 2;

  if (nodeCount === 1) {
    positions[0] = { x: svgWidth / 2, y: svgHeight / 2 };
  } else if (nodeCount === 2) {
    positions[0] = { x: padding + usableWidth * 0.25, y: svgHeight / 2 };
    positions[1] = { x: padding + usableWidth * 0.75, y: svgHeight / 2 };
  } else if (nodeCount <= 4) {
    // Grid layout for 3-4 nodes
    const cols = 2;
    const rows = Math.ceil(nodeCount / cols);
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols && idx < nodeCount; c++) {
        const x = padding + (c + 0.5) * (usableWidth / cols);
        const y = padding + (r + 0.5) * (usableHeight / rows);
        positions[idx] = { x, y };
        idx++;
      }
    }
  } else {
    // Circular layout for more nodes
    const radius = Math.min(usableWidth, usableHeight) / 2.5;
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      positions[i] = { x, y };
    }
  }

  return positions;
};

export const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  nodes,
  edges,
  showPercentages = false,
  showLowSimilarity = false,
}) => {
  const svgWidth = 900;
  const svgHeight = 600;

  const positions = useMemo(
    () => generateNodePositions(nodes.length, svgWidth, svgHeight),
    [nodes.length],
  );

  // Filter edges based on showLowSimilarity setting
  const filteredEdges = useMemo(() => {
    if (showLowSimilarity) {
      return edges;
    }
    return edges.filter((e) => e.semanticSimilarity >= 0.15);
  }, [edges, showLowSimilarity]);

  if (nodes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No submissions to visualize</Text>
      </View>
    );
  }

  // Calculate statistics based on filtered edges
  const criticalEdges = filteredEdges.filter(
    (e) => e.suspicionLevel === "critical",
  ).length;
  const highEdges = filteredEdges.filter(
    (e) => e.suspicionLevel === "high",
  ).length;
  const mediumEdges = filteredEdges.filter(
    (e) => e.suspicionLevel === "medium",
  ).length;
  const lowEdges = filteredEdges.filter(
    (e) => e.suspicionLevel === "low",
  ).length;

  return (
    <View>
      {/* Legend and Stats */}
      <View style={styles.legendContainer}>
        <View style={styles.statsBox}>
          <Text style={styles.statsTitle}>Network Summary</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Submissions:</Text>
            <Text style={styles.statValue}>{nodes.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Comparisons:</Text>
            <Text style={styles.statValue}>{filteredEdges.length}</Text>
          </View>
        </View>

        <View style={styles.legendBox}>
          <Text style={styles.legendTitle}>Similarity Severity Legend</Text>
          <View style={styles.legendItem}>
            <View style={[styles.colorDot, { backgroundColor: "#dc3545" }]} />
            <Text style={styles.legendText}>Critical (80%+)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.colorDot, { backgroundColor: "#fd7e14" }]} />
            <Text style={styles.legendText}>High (60-80%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.colorDot, { backgroundColor: "#ffc107" }]} />
            <Text style={styles.legendText}>Medium (40-60%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.colorDot, { backgroundColor: "#28a745" }]} />
            <Text style={styles.legendText}>Low (0-40%)</Text>
          </View>
        </View>

        <View style={styles.severityBreakdown}>
          <Text style={styles.legendTitle}>Severity Breakdown</Text>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <View
                style={[styles.breakdownDot, { backgroundColor: "#dc3545" }]}
              />
              <Text style={styles.breakdownText}>
                Critical: {criticalEdges}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <View
                style={[styles.breakdownDot, { backgroundColor: "#fd7e14" }]}
              />
              <Text style={styles.breakdownText}>High: {highEdges}</Text>
            </View>
          </View>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <View
                style={[styles.breakdownDot, { backgroundColor: "#ffc107" }]}
              />
              <Text style={styles.breakdownText}>Medium: {mediumEdges}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View
                style={[styles.breakdownDot, { backgroundColor: "#28a745" }]}
              />
              <Text style={styles.breakdownText}>Low: {lowEdges}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Network Graph */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.graphContainer}
      >
        <Svg width={svgWidth} height={svgHeight}>
          {/* Background */}
          <Rect
            x={0}
            y={0}
            width={svgWidth}
            height={svgHeight}
            fill="#f8fafc"
            strokeWidth={1}
            stroke="#e2e8f0"
          />

          {/* Draw edges (connections) first, so they appear behind nodes */}
          {filteredEdges.map((edge, idx) => {
            const source = nodes.findIndex((n) => {
              const match = n.student_id.match(/\d+/);
              const nodeNum = match ? parseInt(match[0]) : 0;
              return nodeNum === edge.studentPair[0];
            });

            const target = nodes.findIndex((n) => {
              const match = n.student_id.match(/\d+/);
              const nodeNum = match ? parseInt(match[0]) : 0;
              return nodeNum === edge.studentPair[1];
            });

            if (source === -1 || target === -1) return null;

            const sourcePos = positions[source];
            const targetPos = positions[target];
            const edgeColor = getEdgeColor(
              edge.suspicionLevel,
              edge.semanticSimilarity,
            );
            const strokeWidth = Math.max(2.5, edge.semanticSimilarity * 6);

            // Calculate label position (middle of line, slightly offset)
            const midX = (sourcePos.x + targetPos.x) / 2;
            const midY = (sourcePos.y + targetPos.y) / 2;
            const dx = targetPos.x - sourcePos.x;
            const dy = targetPos.y - sourcePos.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const offsetX = (-dy / len) * 12;
            const offsetY = (dx / len) * 12;

            return (
              <G key={`edge-${idx}`}>
                <Line
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke={edgeColor}
                  strokeWidth={strokeWidth}
                  opacity={0.75}
                  strokeLinecap="round"
                />
                {/* Edge label - only show if showPercentages is true */}
                {showPercentages && (
                  <>
                    <Rect
                      x={midX + offsetX - 18}
                      y={midY + offsetY - 10}
                      width={36}
                      height={20}
                      fill="white"
                      stroke={edgeColor}
                      strokeWidth={1}
                      rx={3}
                    />
                    <SvgText
                      x={midX + offsetX}
                      y={midY + offsetY + 4}
                      fontSize="11"
                      fontWeight="bold"
                      fill={edgeColor}
                      textAnchor="middle"
                    >
                      <TSpan>{getEdgeLabel(edge.semanticSimilarity)}</TSpan>
                    </SvgText>
                  </>
                )}
              </G>
            );
          })}

          {/* Draw nodes */}
          {nodes.map((node, idx) => {
            const pos = positions[idx];
            const hasSuspiciousEdge = filteredEdges.some(
              (e) =>
                (e.studentPair[0] === idx + 1 ||
                  e.studentPair[1] === idx + 1) &&
                (e.suspicionLevel === "critical" ||
                  e.suspicionLevel === "high"),
            );

            const nodeColor = hasSuspiciousEdge ? "#dc3545" : "#4f46e5";
            const nodeRadius = 35;
            const borderWidth = hasSuspiciousEdge ? 3 : 2;

            return (
              <G key={`node-${idx}`}>
                {/* Node circle background */}
                <Circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeRadius + borderWidth}
                  fill={hasSuspiciousEdge ? "#f8d7da" : "#e7e5ff"}
                  opacity={0.4}
                />
                {/* Node main circle */}
                <Circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeRadius}
                  fill={nodeColor}
                  stroke="white"
                  strokeWidth={borderWidth}
                />
                {/* Student number */}
                <SvgText
                  x={pos.x}
                  y={pos.y - 8}
                  fontSize="16"
                  fontWeight="bold"
                  fill="white"
                  textAnchor="middle"
                >
                  <TSpan>S{idx + 1}</TSpan>
                </SvgText>
                {/* Student ID */}
                <SvgText
                  x={pos.x}
                  y={pos.y + 6}
                  fontSize="12"
                  fill="white"
                  textAnchor="middle"
                >
                  <TSpan>{node.student_id}</TSpan>
                </SvgText>
                {/* Filename label below node */}
                <SvgText
                  x={pos.x}
                  y={pos.y + nodeRadius + 24}
                  fontSize="13"
                  fontWeight="700"
                  fill="#1e293b"
                  textAnchor="middle"
                >
                  <TSpan>
                    {node.filename.length > 18
                      ? node.filename.substring(0, 15) + "..."
                      : node.filename}
                  </TSpan>
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </ScrollView>

      {/* Connection Details */}
      {filteredEdges.length > 0 && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Plagiarism Connections</Text>
          {filteredEdges
            .sort((a, b) => b.semanticSimilarity - a.semanticSimilarity)
            .slice(0, 10)
            .map((edge, idx) => {
              const source = nodes.find((n) => {
                const match = n.student_id.match(/\d+/);
                return (match ? parseInt(match[0]) : 0) === edge.studentPair[0];
              });
              const target = nodes.find((n) => {
                const match = n.student_id.match(/\d+/);
                return (match ? parseInt(match[0]) : 0) === edge.studentPair[1];
              });

              return (
                <View key={idx} style={styles.connectionItem}>
                  <View
                    style={[
                      styles.connectionColor,
                      {
                        backgroundColor: getEdgeColor(
                          edge.suspicionLevel,
                          edge.semanticSimilarity,
                        ),
                      },
                    ]}
                  />
                  <View style={styles.connectionDetails}>
                    <Text style={styles.connectionText}>
                      <Text style={styles.connectionBold}>
                        {source?.filename}
                      </Text>
                      {" ↔ "}
                      <Text style={styles.connectionBold}>
                        {target?.filename}
                      </Text>
                    </Text>
                    <Text style={styles.connectionSimilarity}>
                      Similarity: {(edge.semanticSimilarity * 100).toFixed(1)}%
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.severityBadge,
                      {
                        backgroundColor: getEdgeColor(
                          edge.suspicionLevel,
                          edge.semanticSimilarity,
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.severityBadgeText}>
                      {edge.suspicionLevel.toUpperCase()}
                    </Text>
                  </View>
                </View>
              );
            })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyText: {
    color: "#6c757d",
    fontSize: 14,
  },
  legendContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    flexWrap: "wrap",
  },
  statsBox: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingRight: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  statValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4f46e5",
  },
  legendBox: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minWidth: 200,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: "#475569",
  },
  severityBreakdown: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  breakdownRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  breakdownText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  graphContainer: {
    marginVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  connectionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  connectionColor: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  connectionDetails: {
    flex: 1,
  },
  connectionText: {
    fontSize: 12,
    color: "#475569",
    marginBottom: 4,
  },
  connectionBold: {
    fontWeight: "600",
    color: "#1e293b",
  },
  connectionSimilarity: {
    fontSize: 11,
    color: "#64748b",
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  severityBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
});
