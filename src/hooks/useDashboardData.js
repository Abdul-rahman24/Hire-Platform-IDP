import { useState, useEffect, useCallback } from 'react';
import testConfigService from '../services/testConfigService';
import questionBankService from '../services/questionBankService';
import { fetchAllReports } from '../api/reportsApi';

const safeNum = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);

export function useDashboardData() {
  const [data, setData] = useState({
    kpis: {
      totalCandidates: 0,
      avgPassRate: 0,
      activeTests: 0,
      totalQuestionSets: 0,
    },
    charts: {
      testPerformance: [], // { testName, passRate, avgScorePct }
      funnelData: [], // { testName, invited, started, completed, completionRate, dropOffRate }
      questionSetComposition: [], // { name, value }
    },
    testBreakdown: {
      active: 0,
      inactive: 0,
      total: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all three data sources in parallel
      const [testsRes, reportsRes, setsRes] = await Promise.allSettled([
        testConfigService.getTests(),
        fetchAllReports(),
        questionBankService.getQuestionSets()
      ]);

      const tests = testsRes.status === 'fulfilled' 
        ? (testsRes.value?.items || (Array.isArray(testsRes.value) ? testsRes.value : []))
        : [];
        
      const reports = reportsRes.status === 'fulfilled' 
        ? (Array.isArray(reportsRes.value) ? reportsRes.value : []) 
        : [];
        
      const sets = setsRes.status === 'fulfilled' 
        ? (setsRes.value?.data || setsRes.value?.questionSets || (Array.isArray(setsRes.value) ? setsRes.value : [])) 
        : [];

      // 1. Calculate Total Candidates Evaluated & Pass Rate
      let totalCompleted = 0;
      let totalPassPercentage = 0;
      const testPerformance = [];
      const rankings = [];
      const insights = [];

      reports.forEach((report) => {
        const completed = safeNum(report.totalCompleted ?? report.completedCandidates);
        
        totalCompleted += completed;
        totalPassPercentage += safeNum(report.passPercentage);
        
        // Find matching test for totalMarks
        const testObj = tests.find(t => String(t.testId || t.id) === String(report.testId));
        const totalMarks = testObj ? safeNum(testObj.totalMarks || 100) : 100;
        const avgScorePct = totalMarks > 0 ? (safeNum(report.averageScore) / totalMarks) * 100 : 0;
        const passRate = safeNum(report.passPercentage);

        testPerformance.push({
          testName: report.testName || 'Unnamed Test',
          passRate: passRate,
          failRate: 100 - passRate,
          avgScorePct: avgScorePct,
          completed: completed,
          lastUpdated: report.lastUpdated || report.generatedAt || new Date().toISOString()
        });

        rankings.push({
          testId: report.testId,
          testName: report.testName || 'Unnamed Test',
          passRate: passRate,
          avgScorePct: avgScorePct,
          completed: completed,
          lastUpdated: report.lastUpdated || report.generatedAt || new Date().toISOString()
        });

        if (passRate < 50 && completed > 0) {
          insights.push({
            type: 'warning',
            title: 'Low Pass Rate',
            message: `${report.testName || 'A test'} has a pass rate of ${passRate.toFixed(1)}%.`,
            testId: report.testId
          });
        }
        if (safeNum(report.averageWarnings) > 3 && completed > 0) {
          insights.push({
            type: 'alert',
            title: 'High Warnings',
            message: `${report.testName || 'A test'} averages ${safeNum(report.averageWarnings).toFixed(1)} proctoring warnings per candidate.`,
            testId: report.testId
          });
        }
      });

      // Sort rankings by Pass Rate descending
      rankings.sort((a, b) => b.passRate - a.passRate);

      const avgPassRate = reports.length > 0 ? (totalPassPercentage / reports.length) : 0;

      // 2. Calculate Active/Inactive Tests
      let activeTests = 0;
      let inactiveTests = 0;
      tests.forEach(test => {
        if (test.active === true || test.active === 'true' || String(test.status).toLowerCase() === 'active') {
          activeTests++;
        } else {
          inactiveTests++;
          // Add insight for inactive tests that have completions
          const relatedReport = reports.find(r => String(r.testId) === String(test.testId || test.id));
          const completedCount = relatedReport ? safeNum(relatedReport.totalCompleted ?? relatedReport.completedCandidates) : 0;
          if (relatedReport && completedCount > 0) {
            insights.push({
              type: 'info',
              title: 'Inactive Test Activity',
              message: `${test.testName || 'A test'} is inactive but has ${completedCount} completed evaluations.`,
              testId: test.testId || test.id
            });
          }
        }
      });

      // Sort and slice insights (Priority: alert > warning > info)
      const severityOrder = { alert: 0, warning: 1, info: 2 };
      insights.sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);
      const cappedInsights = insights.slice(0, 15);

      // 3. Calculate Total Question Sets & Composition
      const totalQuestionSets = sets.length;
      
      const setTypeCounts = {
        'MCQ': 0,
        'CODING': 0,
        'DESCRIPTIVE': 0
      };

      sets.forEach((setObj) => {
        const type = (setObj.setType || 'MCQ').toUpperCase();
        if (setTypeCounts[type] !== undefined) {
          setTypeCounts[type]++;
        } else {
          setTypeCounts['MCQ']++; // Fallback
        }
      });

      const questionSetComposition = [
        { name: 'MCQ', value: setTypeCounts['MCQ'] },
        { name: 'Coding', value: setTypeCounts['CODING'] },
        { name: 'Descriptive', value: setTypeCounts['DESCRIPTIVE'] }
      ];

      // Calculate Funnel Data (Attended vs Completed vs Terminated for Top 5 Recent Tests)
      const recentReportsForFunnel = [...reports]
        .sort((a, b) => new Date(b.lastUpdated || b.generatedAt || 0) - new Date(a.lastUpdated || a.generatedAt || 0))
        .slice(0, 5);

      const funnelData = recentReportsForFunnel.map(report => {
        const completed = safeNum(report.totalCompleted ?? report.completedCandidates);
        const attended = Math.max(safeNum(report.totalCandidates), completed);
        const totalTerminated = safeNum(report.totalTerminated);
        
        return {
          testName: report.testName || 'Unnamed Test',
          attended,
          completed,
          totalTerminated
        };
      });

      setData({
        kpis: {
          totalCandidates: totalCompleted,
          avgPassRate,
          activeTests,
          totalQuestionSets,
        },
        charts: {
          testPerformance,
          questionSetComposition,
          funnelData
        },
        rankings,
        insights: cappedInsights,
        testBreakdown: {
          active: activeTests,
          inactive: inactiveTests,
          total: tests.length
        }
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
