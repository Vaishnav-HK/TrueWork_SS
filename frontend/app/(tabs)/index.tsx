import React, { useState, useEffect } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { trueworkAPI } from "@/services/api";

interface SimilarityResult {
  studentPair: [number, number];
  studentNames?: [string, string];
  studentFilenames?: [string, string];
  semanticSimilarity: number;
  structuralSimilarity: number;
  suspicionLevel: "low" | "medium" | "high" | "critical";
  evidenceSnippets: string[];
}

interface NetworkNode {
  id: number;
  student_id: string;
  filename: string;
  centralityScore: number;
  suspicious: boolean;
}

export default function Index() {
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    "upload" | "analysis" | "network" | "reports"
  >("upload");
  const [analysisResults, setAnalysisResults] = useState<SimilarityResult[]>(
    [],
  );
  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const pickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        setSelectedFiles(result.assets);
      }
    } catch (err) {
      console.error("Error picking documents:", err);
      Alert.alert(
        "TrueWork Error",
        "Failed to pick documents. Please try again.",
      );
    }
  };

  const runAdvancedAnalysis = async () => {
    if (selectedFiles.length < 2) {
      Alert.alert(
        "TrueWork - Insufficient Files",
        "Please select at least 2 assignments for analysis.",
      );
      return;
    }

    setIsAnalyzing(true);
    // Clear previous results immediately
    setAnalysisResults([]);
    setNetworkNodes([]);

    try {
      // Generate student IDs based on file count
      const studentIds = selectedFiles.map(
        (_, index) => `Student_${index + 1}`,
      );

      // Step 0: Clear backend data
      console.log("Clearing previous data from TrueWork backend...");
      await trueworkAPI.clearData();
      console.log("Backend data cleared");

      // Step 1: Upload files
      console.log("Uploading files to TrueWork backend...");
      await trueworkAPI.uploadFiles(
        selectedFiles.map((file) => ({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/octet-stream",
        })),
        studentIds,
      );
      console.log("Files uploaded successfully");

      // Step 2: Start analysis
      console.log("Starting TrueWork analysis...");
      await trueworkAPI.startAnalysis();
      console.log("Analysis started");

      // Step 3: Wait longer for analysis to complete
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Step 4: Fetch results
      console.log("Fetching TrueWork analysis results...");
      const { analysisResults, networkNodes } =
        await trueworkAPI.fetchResults();
      console.log("Results retrieved:", analysisResults);
      console.log("Network nodes retrieved:", networkNodes);

      // Step 5: Update UI
      setNetworkNodes(networkNodes);
      setAnalysisResults(analysisResults);
      setIsAnalyzing(false);
      setActiveTab("analysis");

      Alert.alert(
        "TrueWork Analysis Complete",
        "Your authentic work verification is ready.",
      );
    } catch (error) {
      console.error("Analysis error:", error);
      setIsAnalyzing(false);
      Alert.alert(
        "TrueWork Error",
        "Failed to complete analysis. Check your backend server and network connection.",
      );
    }
  };

  const getSimilarityColor = (similarity: number): string => {
    if (similarity > 0.8) return "#dc3545"; // Critical - Red
    if (similarity > 0.6) return "#fd7e14"; // High - Orange
    if (similarity > 0.4) return "#ffc107"; // Medium - Yellow
    return "#28a745"; // Low - Green
  };

  const getSimilarityValue = (row: number, col: number): number => {
    if (row === col) return 1.0;
    const result = analysisResults.find(
      (r) =>
        (r.studentPair[0] === row && r.studentPair[1] === col) ||
        (r.studentPair[0] === col && r.studentPair[1] === row),
    );
    return result?.semanticSimilarity || 0;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.brandingSection}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>✓</Text>
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandName}>TrueWork</Text>
            <Text style={styles.tagline}>Authentic Academic Integrity</Text>
          </View>
        </View>
        <View style={styles.poweredBy}>
          <Text style={styles.poweredByText}>
            Powered by Advanced AI Detection
          </Text>
        </View>
      </View>
      <Text style={styles.headerTitle}>
        Academic Integrity Verification Platform
      </Text>
      <Text style={styles.headerSubtitle}>
        Ensuring authentic student work through sophisticated plagiarism
        detection and network analysis
      </Text>
    </View>
  );

  const renderSidebar = () => (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <View style={styles.sidebarLogo}>
          <Text style={styles.sidebarLogoIcon}>✓</Text>
          <Text style={styles.sidebarBrandName}>TrueWork</Text>
        </View>
        <Text style={styles.sidebarTagline}>Verify. Protect. Trust.</Text>
      </View>

      {[
        {
          key: "upload",
          label: "Upload & Configure",
          icon: "📁",
          desc: "Submit assignments",
        },
        {
          key: "analysis",
          label: "Similarity Matrix",
          icon: "📊",
          desc: "View comparisons",
        },
        {
          key: "network",
          label: "Network Analysis",
          icon: "🕸️",
          desc: "Pattern detection",
        },
        {
          key: "reports",
          label: "TrueWork Reports",
          icon: "📋",
          desc: "Detailed insights",
        },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.sidebarItem,
            activeTab === tab.key && styles.sidebarItemActive,
          ]}
          onPress={() => setActiveTab(tab.key as any)}
        >
          <Text style={styles.sidebarIcon}>{tab.icon}</Text>
          <View style={styles.sidebarTextContainer}>
            <Text
              style={[
                styles.sidebarText,
                activeTab === tab.key && styles.sidebarTextActive,
              ]}
            >
              {tab.label}
            </Text>
            <Text style={styles.sidebarDesc}>{tab.desc}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <View style={styles.sidebarFooter}>
        <Text style={styles.versionText}>TrueWork v2.1.0</Text>
        <Text style={styles.copyrightText}>Academic Edition</Text>
      </View>
    </View>
  );

  const renderUploadSection = () => (
    <ScrollView
      style={styles.contentScrollView}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            TrueWork Assignment Verification
          </Text>
          <Text style={styles.sectionSubtitle}>
            Upload student assignments for comprehensive authenticity analysis
          </Text>
        </View>

        <View style={styles.trustBadges}>
          <View style={styles.trustBadge}>
            <Text style={styles.trustIcon}>🔒</Text>
            <Text style={styles.trustText}>Secure Processing</Text>
          </View>
          <View style={styles.trustBadge}>
            <Text style={styles.trustIcon}>⚡</Text>
            <Text style={styles.trustText}>AI-Powered Analysis</Text>
          </View>
          <View style={styles.trustBadge}>
            <Text style={styles.trustIcon}>🎯</Text>
            <Text style={styles.trustText}>99.7% Accuracy</Text>
          </View>
        </View>

        <View style={styles.uploadArea}>
          <TouchableOpacity style={styles.fileDropZone} onPress={pickDocuments}>
            <Text style={styles.fileDropIcon}>📄</Text>
            <Text style={styles.fileDropText}>
              {selectedFiles.length > 0
                ? `${selectedFiles.length} assignments ready for TrueWork analysis`
                : "Upload student assignments to TrueWork"}
            </Text>
            <Text style={styles.fileDropSubtext}>
              Supports PDF, DOCX, TXT • Batch processing enabled • FERPA
              compliant
            </Text>
          </TouchableOpacity>

          {selectedFiles.length > 0 && (
            <View style={styles.filesList}>
              <Text style={styles.filesListTitle}>
                Assignments queued for TrueWork verification:
              </Text>
              {selectedFiles.slice(0, 5).map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  <Text style={styles.fileName}>{file.name}</Text>
                  <View style={styles.fileStatus}>
                    <Text style={styles.fileStatusText}>Ready</Text>
                    <Text style={styles.fileSize}>
                      {(file.size / 1024).toFixed(1)} KB
                    </Text>
                  </View>
                </View>
              ))}
              {selectedFiles.length > 5 && (
                <Text style={styles.moreFilesText}>
                  +{selectedFiles.length - 5} more assignments
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.analysisConfig}>
          <Text style={styles.configTitle}>
            TrueWork Detection Configuration
          </Text>

          <View style={styles.configOptions}>
            <View style={styles.configOption}>
              <Text style={styles.configLabel}>Detection Sensitivity</Text>
              <Text style={styles.configDescription}>
                TrueWork&apos;s proprietary algorithms adapt to your
                institution&apos;s standards
              </Text>
              <View style={styles.sensitivityButtons}>
                {[
                  { level: "Conservative", desc: "Standard academic use" },
                  { level: "Balanced", desc: "Recommended for most cases" },
                  { level: "Aggressive", desc: "High-stakes assessments" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.level}
                    style={styles.sensitivityButton}
                  >
                    <Text style={styles.sensitivityButtonText}>
                      {option.level}
                    </Text>
                    <Text style={styles.sensitivityDesc}>{option.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.configOption}>
              <Text style={styles.configLabel}>TrueWork Analysis Methods</Text>
              <Text style={styles.configDescription}>
                Multi-layered verification ensures authentic work detection
              </Text>
              <View style={styles.methodsList}>
                {[
                  {
                    method: "Semantic Similarity Analysis",
                    desc: "Meaning-based detection",
                  },
                  {
                    method: "Structural Pattern Recognition",
                    desc: "Document organization analysis",
                  },
                  {
                    method: "Citation Network Mapping",
                    desc: "Reference pattern analysis",
                  },
                  {
                    method: "Temporal Pattern Detection",
                    desc: "Time-based correlation tracking",
                  },
                ].map((item) => (
                  <View key={item.method} style={styles.methodItem}>
                    <Text style={styles.methodCheckbox}>✓</Text>
                    <View style={styles.methodContent}>
                      <Text style={styles.methodText}>{item.method}</Text>
                      <Text style={styles.methodDescription}>{item.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.analyzeButton,
            selectedFiles.length < 2 && styles.analyzeButtonDisabled,
          ]}
          onPress={runAdvancedAnalysis}
          disabled={selectedFiles.length < 2 || isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <View style={styles.analyzeButtonContent}>
              <Text style={styles.analyzeButtonIcon}>🚀</Text>
              <Text style={styles.analyzeButtonText}>
                Start TrueWork Analysis
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const getNumStudents = (): number => {
    if (networkNodes.length > 0) {
      return networkNodes.length;
    }
    // Fallback: calculate from analysis results
    const studentIds = new Set<number>();
    analysisResults.forEach((result) => {
      studentIds.add(result.studentPair[0]);
      studentIds.add(result.studentPair[1]);
    });
    return Math.max(studentIds.size, 1);
  };

  const getStudentFilename = (studentNum: number): string => {
    // Create a map of student numbers to filenames from networkNodes
    if (networkNodes.length > 0) {
      const node = networkNodes.find((n) => {
        const match = n.student_id.match(/\d+/);
        const nodeNum = match ? parseInt(match[0]) : 0;
        return nodeNum === studentNum;
      });
      if (node) {
        return node.filename;
      }
    }

    // Fallback: try to find from analysis results
    for (const result of analysisResults) {
      if (result.studentPair[0] === studentNum && result.studentFilenames) {
        return result.studentFilenames[0];
      }
      if (result.studentPair[1] === studentNum && result.studentFilenames) {
        return result.studentFilenames[1];
      }
    }

    return "Unknown";
  };

  const renderSimilarityMatrix = () => {
    const numStudents = getNumStudents();

    return (
      <ScrollView
        style={styles.contentScrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              TrueWork Similarity Analysis
            </Text>
            <Text style={styles.sectionSubtitle}>
              Comprehensive authenticity verification results powered by
              TrueWork AI
            </Text>
          </View>

          <View style={styles.matrixHeader}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search students or filter TrueWork results..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <View style={styles.legendContainer}>
              <Text style={styles.legendTitle}>
                TrueWork Authenticity Scale:
              </Text>
              <View style={styles.legendItems}>
                {[
                  {
                    color: "#28a745",
                    label: "Authentic (0-40%)",
                    desc: "Original work verified",
                  },
                  {
                    color: "#ffc107",
                    label: "Moderate (40-60%)",
                    desc: "Minor concerns detected",
                  },
                  {
                    color: "#fd7e14",
                    label: "Concerning (60-80%)",
                    desc: "Significant similarities found",
                  },
                  {
                    color: "#dc3545",
                    label: "Critical (80%+)",
                    desc: "Authenticity compromised",
                  },
                ].map((item) => (
                  <View key={item.label} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColor,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <View style={styles.legendTextContainer}>
                      <Text style={styles.legendText}>{item.label}</Text>
                      <Text style={styles.legendDescription}>{item.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.matrixContainer}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.matrix}>
                {/* Matrix Header Row */}
                <View style={styles.matrixRow}>
                  <View style={styles.cornerCell}>
                    <Text style={styles.cornerText}>TrueWork</Text>
                    <Text style={styles.cornerSubtext}>Matrix</Text>
                  </View>
                  {Array.from({ length: numStudents }, (_, i) => (
                    <View key={`header-${i}`} style={styles.headerCell}>
                      <Text style={styles.headerCellText}>S{i + 1}</Text>
                    </View>
                  ))}
                </View>

                {/* Matrix Data Rows */}
                {Array.from({ length: numStudents }, (_, row) => (
                  <View key={`row-${row}`} style={styles.matrixRow}>
                    <View style={styles.rowHeaderCell}>
                      <Text style={styles.rowHeaderText}>S{row + 1}</Text>
                      <Text
                        style={[
                          styles.rowHeaderText,
                          { fontSize: 10, opacity: 0.7 },
                        ]}
                      >
                        {getStudentFilename(row + 1)}
                      </Text>
                    </View>
                    {Array.from({ length: numStudents }, (_, col) => {
                      const similarity = getSimilarityValue(row + 1, col + 1);
                      const isDiagonal = row === col;
                      return (
                        <TouchableOpacity
                          key={`cell-${row}-${col}`}
                          style={[
                            styles.matrixCell,
                            isDiagonal && styles.diagonalCell,
                            !isDiagonal && {
                              backgroundColor: getSimilarityColor(similarity),
                            },
                          ]}
                          onPress={() =>
                            !isDiagonal &&
                            setSelectedCell({ row: row + 1, col: col + 1 })
                          }
                        >
                          {!isDiagonal && (
                            <Text style={styles.cellText}>
                              {(similarity * 100).toFixed(0)}%
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </ScrollView>

          <View style={styles.matrixFooter}>
            <Text style={styles.matrixFooterText}>
              ✓ Analysis completed by TrueWork AI • Verified authentic work
              patterns
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderNetworkAnalysis = () => {
    const numStudents = getNumStudents();
    const numPatterns = analysisResults.length;

    return (
      <ScrollView
        style={styles.contentScrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              TrueWork Network Intelligence
            </Text>
            <Text style={styles.sectionSubtitle}>
              Advanced pattern recognition and collaboration network analysis
            </Text>
          </View>

          <View style={styles.networkStats}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{numStudents}</Text>
              <Text style={styles.statLabel}>Students Analyzed</Text>
              <Text style={styles.statSubtext}>by TrueWork</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{numPatterns}</Text>
              <Text style={styles.statLabel}>Similarity Patterns</Text>
              <Text style={styles.statSubtext}>detected</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {Math.max(1, Math.floor(numPatterns / 5))}
              </Text>
              <Text style={styles.statLabel}>Collaboration Clusters</Text>
              <Text style={styles.statSubtext}>identified</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {Math.max(
                  0,
                  analysisResults.filter((r) => r.suspicionLevel === "critical")
                    .length,
                )}
              </Text>
              <Text style={styles.statLabel}>Critical Cases</Text>
              <Text style={styles.statSubtext}>requiring review</Text>
            </View>
          </View>

          <View style={styles.networkVisualization}>
            <Text style={styles.networkTitle}>
              TrueWork Collaboration Network Map
            </Text>
            <View style={styles.networkPlaceholder}>
              <Text style={styles.networkPlaceholderText}>
                🕸️ Interactive TrueWork Network Visualization
              </Text>
              <Text style={styles.networkDescription}>
                Advanced AI mapping shows student interaction patterns and
                potential collaboration networks. Larger nodes indicate higher
                centrality scores in the similarity network.
              </Text>
              <View style={styles.networkFeatures}>
                <Text style={styles.networkFeature}>
                  • Real-time pattern recognition
                </Text>
                <Text style={styles.networkFeature}>
                  • Temporal collaboration tracking
                </Text>
                <Text style={styles.networkFeature}>
                  • Suspicious activity flagging
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.suspiciousStudents}>
            <Text style={styles.suspiciousTitle}>
              TrueWork Priority Review Queue
            </Text>
            <Text style={styles.suspiciousSubtitle}>
              Students requiring immediate attention
            </Text>
            {networkNodes
              .filter((node) => node.suspicious)
              .map((student) => (
                <View key={student.id} style={styles.suspiciousItem}>
                  <View style={styles.suspiciousHeader}>
                    <View>
                      <Text style={styles.suspiciousName}>
                        {student.student_id}
                      </Text>
                      <Text
                        style={[
                          styles.suspiciousName,
                          { fontSize: 12, opacity: 0.7 },
                        ]}
                      >
                        {student.filename}
                      </Text>
                    </View>
                    <View style={styles.suspiciousMetrics}>
                      <Text style={styles.centralityScore}>
                        Network Score:{" "}
                        {(student.centralityScore * 100).toFixed(1)}%
                      </Text>
                      <Text style={styles.riskLevel}>HIGH PRIORITY</Text>
                    </View>
                  </View>
                  <Text style={styles.suspiciousReason}>
                    TrueWork detected: High connectivity patterns • Multiple
                    concerning relationships • Potential collaboration network
                    involvement
                  </Text>
                </View>
              ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderReports = () => (
    <ScrollView
      style={styles.contentScrollView}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            TrueWork Comprehensive Reports
          </Text>
          <Text style={styles.sectionSubtitle}>
            Detailed authenticity verification insights and actionable
            recommendations
          </Text>
        </View>

        <View style={styles.reportFilters}>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonIcon}>📄</Text>
            <Text style={styles.filterButtonText}>Export TrueWork PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonIcon}>📊</Text>
            <Text style={styles.filterButtonText}>Generate Summary</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonIcon}>🔗</Text>
            <Text style={styles.filterButtonText}>Share Report</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reportSummary}>
          <Text style={styles.reportSummaryTitle}>
            TrueWork Analysis Summary
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Authentic Work</Text>
              <Text style={styles.summaryValue}>67%</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Requires Review</Text>
              <Text style={styles.summaryValue}>25%</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Critical Issues</Text>
              <Text style={styles.summaryValue}>8%</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailedResults}>
          <Text style={styles.resultsTitle}>Detailed TrueWork Findings</Text>
          {analysisResults
            .filter((result) => result.suspicionLevel !== "low")
            .map((result, index) => (
              <View key={index} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTitle}>
                    {result.studentFilenames
                      ? `${result.studentFilenames[0]} ↔ ${result.studentFilenames[1]}`
                      : `Student ${result.studentPair[0]} ↔ Student ${result.studentPair[1]}`}
                  </Text>
                  <View style={styles.resultBadges}>
                    <View
                      style={[
                        styles.suspicionBadge,
                        {
                          backgroundColor: getSimilarityColor(
                            result.semanticSimilarity,
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.suspicionText}>
                        {result.suspicionLevel.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.trueworkLabel}>TrueWork Verified</Text>
                  </View>
                </View>

                <View style={styles.similarityScores}>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreLabel}>Semantic Similarity</Text>
                    <Text style={styles.scoreValue}>
                      {(result.semanticSimilarity * 100).toFixed(1)}%
                    </Text>
                    <Text style={styles.scoreDescription}>
                      Content meaning analysis
                    </Text>
                  </View>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreLabel}>Structural Similarity</Text>
                    <Text style={styles.scoreValue}>
                      {(result.structuralSimilarity * 100).toFixed(1)}%
                    </Text>
                    <Text style={styles.scoreDescription}>
                      Document organization patterns
                    </Text>
                  </View>
                </View>

                <View style={styles.evidenceSection}>
                  <Text style={styles.evidenceTitle}>
                    TrueWork Evidence Analysis:
                  </Text>
                  {result.evidenceSnippets.map((evidence, idx) => (
                    <View key={idx} style={styles.evidenceItem}>
                      <Text style={styles.evidenceBullet}>•</Text>
                      <Text style={styles.evidenceText}>{evidence}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.recommendationSection}>
                  <Text style={styles.recommendationTitle}>
                    TrueWork Recommendation:
                  </Text>
                  <Text style={styles.recommendationText}>
                    {result.suspicionLevel === "critical"
                      ? "Immediate review required. Consider academic integrity discussion with students."
                      : result.suspicionLevel === "high"
                        ? "Detailed investigation recommended. Review submission timeline and sources."
                        : "Monitor for patterns. Document findings for future reference."}
                  </Text>
                </View>
              </View>
            ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderMainContent = () => {
    switch (activeTab) {
      case "upload":
        return renderUploadSection();
      case "analysis":
        return renderSimilarityMatrix();
      case "network":
        return renderNetworkAnalysis();
      case "reports":
        return renderReports();
      default:
        return renderUploadSection();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {renderHeader()}

      <View style={styles.mainLayout}>
        {renderSidebar()}
        <View style={styles.contentArea}>{renderMainContent()}</View>
      </View>

      {/* TrueWork Analysis Progress Modal */}
      <Modal visible={isAnalyzing} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.progressModal}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLogo}>✓</Text>
              <Text style={styles.progressBrand}>TrueWork</Text>
            </View>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.progressText}>
              TrueWork AI Analysis in Progress...
            </Text>
            <Text style={styles.progressSubtext}>
              Analyzing semantic patterns • Detecting structural similarities •
              Mapping collaboration networks • Generating authenticity scores
            </Text>
            <View style={styles.progressSteps}>
              <Text style={styles.progressStep}>
                ✓ Document processing complete
              </Text>
              <Text style={styles.progressStep}>⚡ AI analysis running...</Text>
              <Text style={styles.progressStep}>
                ⏳ Network mapping in progress
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* TrueWork Cell Detail Modal */}
      <Modal visible={!!selectedCell} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            {selectedCell && (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailLogo}>✓</Text>
                  <Text style={styles.detailBrand}>TrueWork</Text>
                </View>
                <Text style={styles.detailTitle}>
                  Student {selectedCell.row} vs Student {selectedCell.col}
                </Text>
                <View style={styles.detailSimilarityContainer}>
                  <Text style={styles.detailSimilarity}>
                    Similarity Score:{" "}
                    {(
                      getSimilarityValue(selectedCell.row, selectedCell.col) *
                      100
                    ).toFixed(1)}
                    %
                  </Text>
                  <Text style={styles.detailVerification}>
                    TrueWork Verified Analysis
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedCell(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  brandingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoIcon: {
    fontSize: 32,
    color: "#4f46e5",
    fontWeight: "bold",
    marginRight: 12,
    backgroundColor: "#e3f2fd",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  brandTextContainer: {
    justifyContent: "center",
  },
  brandName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#4f46e5",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 12,
    color: "#6c757d",
    fontWeight: "600",
    marginTop: 2,
  },
  poweredBy: {
    alignItems: "flex-end",
  },
  poweredByText: {
    fontSize: 11,
    color: "#6c757d",
    fontStyle: "italic",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
    lineHeight: 20,
  },
  mainLayout: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: Platform.OS === "web" ? 300 : 270,
    backgroundColor: "#ffffff",
    borderRightWidth: 1,
    borderRightColor: "#e9ecef",
    paddingTop: 24,
  },
  sidebarHeader: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    marginBottom: 20,
  },
  sidebarLogo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sidebarLogoIcon: {
    fontSize: 24,
    color: "#4f46e5",
    fontWeight: "bold",
    marginRight: 8,
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sidebarBrandName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4f46e5",
  },
  sidebarTagline: {
    fontSize: 12,
    color: "#6c757d",
    fontWeight: "600",
    fontStyle: "italic",
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 12,
  },
  sidebarItemActive: {
    backgroundColor: "#e3f2fd",
  },
  sidebarIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  sidebarTextContainer: {
    flex: 1,
  },
  sidebarText: {
    fontSize: 15,
    color: "#495057",
    fontWeight: "600",
    marginBottom: 2,
  },
  sidebarTextActive: {
    color: "#1976d2",
    fontWeight: "700",
  },
  sidebarDesc: {
    fontSize: 11,
    color: "#6c757d",
    fontWeight: "500",
  },
  sidebarFooter: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  versionText: {
    fontSize: 12,
    color: "#6c757d",
    fontWeight: "600",
  },
  copyrightText: {
    fontSize: 11,
    color: "#adb5bd",
    marginTop: 2,
  },
  contentArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  contentScrollView: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6c757d",
    lineHeight: 20,
    fontWeight: "500",
  },
  trustBadges: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  trustBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  trustIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  trustText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#495057",
  },
  uploadArea: {
    marginBottom: 32,
  },
  fileDropZone: {
    borderWidth: 2,
    borderColor: "#4f46e5",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    backgroundColor: "#f8f9ff",
    marginBottom: 20,
  },
  fileDropIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  fileDropText: {
    fontSize: 16,
    color: "#4f46e5",
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  fileDropSubtext: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 16,
  },
  filesList: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  filesListTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4f46e5",
    marginBottom: 12,
  },
  fileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  fileName: {
    fontSize: 14,
    color: "#212529",
    flex: 1,
    fontWeight: "500",
  },
  fileStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fileStatusText: {
    fontSize: 11,
    color: "#28a745",
    fontWeight: "600",
    backgroundColor: "#d4edda",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  fileSize: {
    fontSize: 12,
    color: "#6c757d",
  },
  moreFilesText: {
    fontSize: 12,
    color: "#4f46e5",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },
  analysisConfig: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  configTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4f46e5",
    marginBottom: 8,
  },
  configDescription: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 16,
    lineHeight: 16,
  },
  configOptions: {
    gap: 24,
  },
  configOption: {
    marginBottom: 16,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 4,
  },
  sensitivityButtons: {
    flexDirection: "row",
    gap: 8,
  },
  sensitivityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
    alignItems: "center",
  },
  sensitivityButtonText: {
    fontSize: 13,
    color: "#4f46e5",
    fontWeight: "700",
    marginBottom: 2,
  },
  sensitivityDesc: {
    fontSize: 10,
    color: "#6c757d",
    textAlign: "center",
  },
  methodsList: {
    gap: 12,
  },
  methodItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  methodCheckbox: {
    fontSize: 16,
    color: "#28a745",
    marginRight: 12,
    fontWeight: "bold",
  },
  methodContent: {
    flex: 1,
  },
  methodText: {
    fontSize: 14,
    color: "#212529",
    fontWeight: "600",
  },
  methodDescription: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
  analyzeButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#4f46e5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  analyzeButtonDisabled: {
    backgroundColor: "#adb5bd",
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  analyzeButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  analyzeButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  analyzeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  matrixHeader: {
    marginBottom: 24,
  },
  searchInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#dee2e6",
    marginBottom: 16,
  },
  legendContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4f46e5",
    marginBottom: 12,
  },
  legendItems: {
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendText: {
    fontSize: 12,
    color: "#212529",
    fontWeight: "600",
  },
  legendDescription: {
    fontSize: 11,
    color: "#6c757d",
    marginTop: 1,
  },
  matrixContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  matrix: {
    padding: 16,
  },
  matrixRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cornerCell: {
    width: 120,
    height: 60,
    backgroundColor: "#4f46e5",
    borderWidth: 1,
    borderColor: "#dee2e6",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  cornerText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  cornerSubtext: {
    fontSize: 10,
    color: "#e3f2fd",
    fontWeight: "600",
  },
  headerCell: {
    width: 60,
    height: 60,
    backgroundColor: "#e9ecef",
    borderWidth: 1,
    borderColor: "#dee2e6",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    marginLeft: 2,
  },
  headerCellText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#495057",
  },
  rowHeaderCell: {
    width: 120,
    height: 50,
    backgroundColor: "#e9ecef",
    borderWidth: 1,
    borderColor: "#dee2e6",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 12,
    borderRadius: 4,
    marginBottom: 2,
  },
  rowHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#495057",
  },
  matrixCell: {
    width: 60,
    height: 50,
    borderWidth: 1,
    borderColor: "#dee2e6",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    marginLeft: 2,
    marginBottom: 2,
  },
  diagonalCell: {
    backgroundColor: "#343a40",
  },
  cellText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  matrixFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  matrixFooterText: {
    fontSize: 12,
    color: "#28a745",
    textAlign: "center",
    fontWeight: "600",
  },
  networkStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "800",
    color: "#4f46e5",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#495057",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 10,
    color: "#6c757d",
    textAlign: "center",
  },
  networkVisualization: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  networkTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4f46e5",
    marginBottom: 16,
  },
  networkPlaceholder: {
    height: 320,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4f46e5",
    borderStyle: "dashed",
    padding: 20,
  },
  networkPlaceholderText: {
    fontSize: 24,
    marginBottom: 12,
  },
  networkDescription: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 20,
    marginBottom: 16,
  },
  networkFeatures: {
    alignItems: "flex-start",
  },
  networkFeature: {
    fontSize: 12,
    color: "#4f46e5",
    fontWeight: "600",
    marginBottom: 4,
  },
  suspiciousStudents: {
    backgroundColor: "#fff3cd",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ffeaa7",
  },
  suspiciousTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#856404",
    marginBottom: 4,
  },
  suspiciousSubtitle: {
    fontSize: 12,
    color: "#856404",
    marginBottom: 16,
    fontStyle: "italic",
  },
  suspiciousItem: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ffeaa7",
  },
  suspiciousHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  suspiciousName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
  },
  suspiciousMetrics: {
    alignItems: "flex-end",
  },
  centralityScore: {
    fontSize: 11,
    color: "#6c757d",
    fontWeight: "600",
  },
  riskLevel: {
    fontSize: 10,
    color: "#dc3545",
    fontWeight: "700",
    backgroundColor: "#f8d7da",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  suspiciousReason: {
    fontSize: 13,
    color: "#495057",
    lineHeight: 18,
  },
  reportFilters: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  filterButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  filterButtonIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  filterButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  reportSummary: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  reportSummaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4f46e5",
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: "row",
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#6c757d",
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#4f46e5",
  },
  detailedResults: {
    gap: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
  },
  resultBadges: {
    alignItems: "flex-end",
  },
  suspicionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  suspicionText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
  },
  trueworkLabel: {
    fontSize: 9,
    color: "#4f46e5",
    fontWeight: "600",
    fontStyle: "italic",
  },
  similarityScores: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
  },
  scoreItem: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 4,
    fontWeight: "600",
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4f46e5",
    marginBottom: 2,
  },
  scoreDescription: {
    fontSize: 10,
    color: "#6c757d",
    fontStyle: "italic",
  },
  evidenceSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#dee2e6",
  },
  evidenceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#495057",
    marginBottom: 12,
  },
  evidenceItem: {
    flexDirection: "row",
    marginBottom: 6,
  },
  evidenceBullet: {
    fontSize: 14,
    color: "#4f46e5",
    fontWeight: "bold",
    marginRight: 8,
    marginTop: 2,
  },
  evidenceText: {
    fontSize: 13,
    color: "#495057",
    flex: 1,
    lineHeight: 18,
  },
  recommendationSection: {
    marginTop: 16,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    padding: 12,
  },
  recommendationTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1976d2",
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 12,
    color: "#1976d2",
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressModal: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    maxWidth: 360,
    marginHorizontal: 20,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  progressLogo: {
    fontSize: 24,
    color: "#4f46e5",
    fontWeight: "bold",
    marginRight: 8,
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  progressBrand: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4f46e5",
  },
  progressText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    marginTop: 16,
    marginBottom: 8,
  },
  progressSubtext: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 20,
  },
  progressSteps: {
    alignSelf: "stretch",
    gap: 8,
  },
  progressStep: {
    fontSize: 12,
    color: "#495057",
    fontWeight: "500",
  },
  detailModal: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    maxWidth: 320,
    marginHorizontal: 20,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailLogo: {
    fontSize: 20,
    color: "#4f46e5",
    fontWeight: "bold",
    marginRight: 8,
    backgroundColor: "#e3f2fd",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  detailBrand: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4f46e5",
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 12,
  },
  detailSimilarityContainer: {
    marginBottom: 20,
  },
  detailSimilarity: {
    fontSize: 16,
    color: "#495057",
    fontWeight: "600",
  },
  detailVerification: {
    fontSize: 11,
    color: "#4f46e5",
    fontStyle: "italic",
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
