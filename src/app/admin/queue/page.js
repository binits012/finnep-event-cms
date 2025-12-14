"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  AlertTitle,
  LinearProgress,
  Paper,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  Queue as QueueIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Analytics as AnalyticsIcon,
  ShowChart as ShowChartIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

export default function QueueAdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // Analytics data for charts
  const [chartData, setChartData] = useState({
    timestamps: [],
    cpuUsage: [],
    memoryUsage: [],
    responseTime: [],
    errorRate: [],
    activeConnections: [],
    queueSize: []
  });
  const maxDataPoints = 50; // Keep last 50 data points (25 minutes at 30s intervals)


  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);


  const loadDashboardData = async () => {
    try {
      const queueServiceUrl = process.env.NEXT_PUBLIC_QUEUE_SERVICE_URL || 'http://localhost:9999';
      const apiKey = process.env.NEXT_PUBLIC_QUEUE_ADMIN_API_KEY || 'dev-admin-key1';

      const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      };

      // First refresh the system metrics, then get all data
      await fetch(`${queueServiceUrl}/api/admin/system/refresh`, {
        method: 'GET',
        headers
      });

      const [statsResponse, metricsResponse] = await Promise.all([
        fetch(`${queueServiceUrl}/api/admin/queue/stats`, { headers }),
        fetch(`${queueServiceUrl}/api/admin/system/metrics`, { headers })
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('CMS received queue stats:', statsData);
        // The queue service returns data nested under 'queue' property
        const queueStats = statsData.queue || statsData;
        console.log('CMS setting queue stats:', queueStats);
        setStats(queueStats);
      } else {
        console.error('CMS queue stats request failed:', statsResponse.status, statsResponse.statusText);
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);

        // Update chart data with new metrics
        const timestamp = new Date();
        setChartData(prevData => {
          const newTimestamps = [...prevData.timestamps, timestamp];
          const newCpuUsage = [...prevData.cpuUsage, metricsData.cpu || 0];
          const newMemoryUsage = [...prevData.memoryUsage, metricsData.memory || 0];
          const newResponseTime = [...prevData.responseTime, metricsData.responseTime || 0];
          const newErrorRate = [...prevData.errorRate, metricsData.errorRate || 0];
          const newActiveConnections = [...prevData.activeConnections, metricsData.connections || 0];
          const newQueueSize = [...prevData.queueSize, (stats?.queueSize) || 0];

          // Keep only the last maxDataPoints
          const keepCount = Math.min(maxDataPoints, newTimestamps.length);

          return {
            timestamps: newTimestamps.slice(-keepCount),
            cpuUsage: newCpuUsage.slice(-keepCount),
            memoryUsage: newMemoryUsage.slice(-keepCount),
            responseTime: newResponseTime.slice(-keepCount),
            errorRate: newErrorRate.slice(-keepCount),
            activeConnections: newActiveConnections.slice(-keepCount),
            queueSize: newQueueSize.slice(-keepCount)
          };
        });
      }

      // Generate alerts based on metrics
      generateAlerts();

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      addAlert('error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAlerts = () => {
    const newAlerts = [];

    if (metrics) {
      if (metrics.cpu > 95) {
        newAlerts.push({
          id: 'cpu-critical',
          type: 'error',
          message: `Critical CPU usage: ${metrics.cpu.toFixed(1)}%`,
          timestamp: new Date().toISOString()
        });
      } else if (metrics.cpu > 90) {
        newAlerts.push({
          id: 'cpu-high',
          type: 'warning',
          message: `High CPU usage: ${metrics.cpu.toFixed(1)}%`,
          timestamp: new Date().toISOString()
        });
      }

      if (metrics.memory > 95) {
        newAlerts.push({
          id: 'memory-critical',
          type: 'error',
          message: `Critical memory usage: ${metrics.memory.toFixed(1)}%`,
          timestamp: new Date().toISOString()
        });
      }

      if (metrics.responseTime > 5000) {
        newAlerts.push({
          id: 'response-slow',
          type: 'warning',
          message: `Slow response time: ${metrics.responseTime.toFixed(0)}ms`,
          timestamp: new Date().toISOString()
        });
      }

      if (metrics.errorRate > 5) {
        newAlerts.push({
          id: 'error-rate-high',
          type: 'error',
          message: `High error rate: ${metrics.errorRate.toFixed(1)}%`,
          timestamp: new Date().toISOString()
        });
      }
    }

    if (stats?.isActive && stats.queueSize > 50) {
      newAlerts.push({
        id: 'queue-large',
        type: 'warning',
        message: `Large queue: ${stats.queueSize} users waiting`,
        timestamp: new Date().toISOString()
      });
    }

    setAlerts(newAlerts);
  };

  const addAlert = (type, message) => {
    const alert = {
      id: `alert-${Date.now()}`,
      type,
      message,
      timestamp: new Date().toISOString()
    };
    setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep only 10 recent alerts
  };

  const toggleQueue = async (active, reason) => {
    setIsToggling(true);
    try {
      const queueServiceUrl = process.env.NEXT_PUBLIC_QUEUE_SERVICE_URL || 'http://localhost:9999';
      const response = await fetch(`${queueServiceUrl}/api/admin/queue/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_QUEUE_ADMIN_API_KEY || 'dev-admin-key1'
        },
        body: JSON.stringify({ active, reason })
      });

      if (response.ok) {
        addAlert('success', `Queue ${active ? 'activated' : 'deactivated'}: ${reason}`);
        loadDashboardData(); // Refresh data
      } else {
        addAlert('error', 'Failed to toggle queue status');
      }
    } catch (error) {
      console.error('Toggle queue error:', error);
      addAlert('error', 'Failed to toggle queue status');
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Loading Dashboard...
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            Fetching queue statistics and system metrics
          </Typography>
        </Card>
      </Box>
    );
  }

  // Get status color for Material-UI chips
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get alert severity for Material-UI
  const getAlertSeverity = (type) => {
    switch (type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'info';
    }
  };

  // Get alert icon
  const getAlertIcon = (type) => {
    switch (type) {
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'success':
        return <CheckCircleIcon />;
      default:
        return <InfoIcon />;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 3 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <QueueIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                Queue Management Dashboard
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Monitor and control the global queuing system in real-time
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              icon={<TimelineIcon />}
              label="Live Monitoring"
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<PeopleIcon />}
              label={`${stats?.queueSize || 0} in queue`}
              color="info"
              variant="outlined"
            />
            <Tooltip title="Last updated">
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Updated {new Date().toLocaleTimeString()}
              </Typography>
            </Tooltip>
          </Box>
        </Box>

        {/* System Alerts */}
        {alerts.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              ⚠️ System Alerts
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {alerts.slice(0, 3).map((alert) => (
                <Alert
                  key={alert.id}
                  severity={getAlertSeverity(alert.type)}
                  icon={getAlertIcon(alert.type)}
                  sx={{ borderRadius: 2 }}
                >
                  <AlertTitle sx={{ fontWeight: 'bold' }}>
                    {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert
                  </AlertTitle>
                  {alert.message}
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    {new Date(alert.timestamp).toLocaleString()}
                  </Typography>
                </Alert>
              ))}
            </Box>
          </Box>
        )}

        {/* Main Dashboard Grid */}
        <Grid container spacing={3}>
          {/* Queue Status Card */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, height: 'fit-content' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <QueueIcon />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Queue Status
                    </Typography>
                  </Box>
                  <Chip
                    label={(() => {
                      console.log('UI Render - stats.isActive:', stats?.isActive, 'stats:', stats);
                      return stats?.isActive ? 'Active' : 'Inactive';
                    })()}
                    color={stats?.isActive ? 'success' : 'default'}
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        Current Queue Size
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {stats?.queueSize || 0}
                      </Typography>
                    </Box>
                    <PeopleIcon sx={{ color: 'action.active', fontSize: 32 }} />
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        Est. Wait Time
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {stats?.estimatedWaitMinutes || 0} min
                      </Typography>
                    </Box>
                    <SpeedIcon sx={{ color: 'warning.main', fontSize: 28 }} />
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        Processed Today
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {stats?.processedToday || 0}
                      </Typography>
                    </Box>
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 28 }} />
                  </Box>

                  {stats?.isActive && stats.activationReason && (
                    <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider', mt: 2 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        Activation Reason
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                        {stats.activationReason}
                      </Typography>
                      {stats.activatedAt && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Activated: {new Date(stats.activatedAt).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* System Metrics */}
          {/* System Metrics Card */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, height: 'fit-content' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                    <TrendingUpIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    System Health
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* CPU Usage */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        CPU Usage
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {metrics?.cpu?.toFixed(1) || 0}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(metrics?.cpu || 0, 100)}
                      color={metrics?.cpu > 90 ? 'error' : metrics?.cpu > 80 ? 'warning' : 'success'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  {/* Memory Usage */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Memory Usage
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {metrics?.memory?.toFixed(1) || 0}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(metrics?.memory || 0, 100)}
                      color={metrics?.memory > 95 ? 'error' : metrics?.memory > 85 ? 'warning' : 'success'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  {/* Response Time */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        Response Time
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {metrics?.responseTime?.toFixed(0) || 0}ms
                      </Typography>
                    </Box>
                    <SpeedIcon sx={{ color: 'info.main', fontSize: 28 }} />
                  </Box>

                  {/* Active Connections */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        Active Connections
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {metrics?.connections || 0}
                      </Typography>
                    </Box>
                    <Badge badgeContent={metrics?.connections || 0} color="primary">
                      <PeopleIcon sx={{ fontSize: 28 }} />
                    </Badge>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Real-time Analytics */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <TimelineIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Real-time Analytics
                  </Typography>
                </Box>

                <Box sx={{ height: 600, overflow: 'auto' }}>
                  <Grid container spacing={2}>
                    {/* CPU & Memory Usage Chart */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ height: 280 }}>
                        <CardContent sx={{ height: '100%', pb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <SpeedIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              System Resources
                            </Typography>
                          </Box>
                          <Box sx={{ height: 200 }}>
                            <Line
                              data={{
                                labels: chartData.timestamps.map(t => t.toLocaleTimeString()),
                                datasets: [
                                  {
                                    label: 'CPU Usage (%)',
                                    data: chartData.cpuUsage,
                                    borderColor: 'rgb(75, 192, 192)',
                                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                                    tension: 0.4,
                                    pointRadius: 2,
                                  },
                                  {
                                    label: 'Memory Usage (%)',
                                    data: chartData.memoryUsage,
                                    borderColor: 'rgb(255, 99, 132)',
                                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                                    tension: 0.4,
                                    pointRadius: 2,
                                  },
                                ],
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { position: 'top' },
                                },
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    max: 100,
                                  },
                                },
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Response Time Chart */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ height: 280 }}>
                        <CardContent sx={{ height: '100%', pb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <TimelineIcon sx={{ mr: 1, color: 'success.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              Response Time
                            </Typography>
                          </Box>
                          <Box sx={{ height: 200 }}>
                            <Line
                              data={{
                                labels: chartData.timestamps.map(t => t.toLocaleTimeString()),
                                datasets: [
                                  {
                                    label: 'Response Time (ms)',
                                    data: chartData.responseTime,
                                    borderColor: 'rgb(54, 162, 235)',
                                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                                    tension: 0.4,
                                    pointRadius: 2,
                                  },
                                ],
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { position: 'top' },
                                },
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                  },
                                },
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Queue Size & Connections Chart */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ height: 280 }}>
                        <CardContent sx={{ height: '100%', pb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <PeopleIcon sx={{ mr: 1, color: 'warning.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              Queue Activity
                            </Typography>
                          </Box>
                          <Box sx={{ height: 200 }}>
                            <Bar
                              data={{
                                labels: chartData.timestamps.map(t => t.toLocaleTimeString()),
                                datasets: [
                                  {
                                    label: 'Queue Size',
                                    data: chartData.queueSize,
                                    backgroundColor: 'rgba(255, 206, 86, 0.6)',
                                    borderColor: 'rgb(255, 206, 86)',
                                    borderWidth: 1,
                                  },
                                  {
                                    label: 'Active Connections',
                                    data: chartData.activeConnections,
                                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                                    borderColor: 'rgb(153, 102, 255)',
                                    borderWidth: 1,
                                  },
                                ],
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { position: 'top' },
                                },
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                  },
                                },
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Error Rate Chart */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ height: 280 }}>
                        <CardContent sx={{ height: '100%', pb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <ErrorIcon sx={{ mr: 1, color: 'error.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              Error Rate
                            </Typography>
                          </Box>
                          <Box sx={{ height: 200 }}>
                            <Line
                              data={{
                                labels: chartData.timestamps.map(t => t.toLocaleTimeString()),
                                datasets: [
                                  {
                                    label: 'Error Rate (%)',
                                    data: chartData.errorRate,
                                    borderColor: 'rgb(255, 99, 132)',
                                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                                    tension: 0.4,
                                    pointRadius: 2,
                                    fill: true,
                                  },
                                ],
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { position: 'top' },
                                },
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    max: 10,
                                  },
                                },
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Queue Controls */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                    <QueueIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Queue Management Controls
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="error"
                      size="large"
                      startIcon={isToggling ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                      onClick={() => toggleQueue(true, 'Emergency activation')}
                      disabled={isToggling}
                      sx={{
                        py: 1.5,
                        fontWeight: 'bold',
                        borderRadius: 2,
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: 3,
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      {isToggling ? 'Activating...' : 'Emergency Activate'}
                    </Button>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      size="large"
                      startIcon={isToggling ? <CircularProgress size={20} /> : <StopIcon />}
                      onClick={() => toggleQueue(false, 'Emergency deactivation')}
                      disabled={isToggling}
                      sx={{
                        py: 1.5,
                        fontWeight: 'bold',
                        borderRadius: 2,
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: 3,
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      {isToggling ? 'Deactivating...' : 'Emergency Deactivate'}
                    </Button>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      size="large"
                      startIcon={isLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
                      onClick={loadDashboardData}
                      disabled={isLoading}
                      sx={{
                        py: 1.5,
                        fontWeight: 'bold',
                        borderRadius: 2,
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                          transform: 'translateY(-1px)',
                          boxShadow: 2,
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      {isLoading ? 'Refreshing...' : 'Refresh Dashboard'}
                    </Button>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Chip
                    icon={<QueueIcon />}
                    label={`Queue: ${stats?.isActive ? 'Active' : 'Inactive'}`}
                    color={stats?.isActive ? 'success' : 'default'}
                    variant="outlined"
                  />
                  <Chip
                    icon={<PeopleIcon />}
                    label={`Size: ${stats?.queueSize || 0}`}
                    color="info"
                    variant="outlined"
                  />
                  <Chip
                    icon={<SpeedIcon />}
                    label={`Wait: ${stats?.estimatedWaitMinutes || 0}min`}
                    color="warning"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
