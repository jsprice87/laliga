/**
 * API Client
 * Handles all communication with the backend API
 */

export class APIClient {
  constructor() {
    this.baseURL = this.getBaseURL();
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Initialize API client
   */
  async init() {
    // Test API connectivity
    try {
      await this.healthCheck();
    } catch (error) {
      console.warn('API health check failed, continuing with offline mode');
    }
  }

  /**
   * Get base URL for API calls
   */
  getBaseURL() {
    if (typeof window !== 'undefined') {
      // Browser environment
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3001';
      }
      return 'https://laligadelfuego.vercel.app';
    }
    return 'https://laligadelfuego.vercel.app';
  }

  /**
   * Make HTTP request with enhanced error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      timeout: options.timeout || 10000, // 10 second default timeout
      ...options
    };

    try {
      // Add request timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      config.signal = controller.signal;

      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      // Enhanced error handling based on status codes
      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw this.createAPIError(response.status, errorData, endpoint);
      }

      const data = await response.json();
      return data;
      
    } catch (error) {
      // Handle specific error types
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${config.timeout}ms: ${endpoint}`);
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Network error - please check your connection: ${endpoint}`);
      }
      
      // Log error with context
      console.error(`API request failed: ${endpoint}`, {
        url,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw this.enhanceError(error, endpoint);
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const searchParams = new URLSearchParams(params);
    const url = searchParams.toString() ? `${endpoint}?${searchParams}` : endpoint;
    
    return this.request(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * Health check
   */
  async healthCheck() {
    return this.get('/api/health');
  }

  /**
   * Get live teams data
   */
  async getTeamsLive(week, year) {
    return this.get('/api/teams', { week, season: year, live: true });
  }

  /**
   * Get historical teams data
   */
  async getTeamsHistorical(year) {
    // For historical data, always use Week 14 (end of regular season)
    const response = await this.get('/api/teams', { season: year, week: 14 });
    
    // DEBUG: Log what the frontend receives
    console.log('🎯 API CLIENT - Received response for', year, ':', response);
    if (response && response.teams && response.teams.length > 0) {
      console.log('🎯 API CLIENT - First team Liga Bucks:', response.teams[0].laLigaBucks);
      console.log('🎯 API CLIENT - First team data:', {
        name: response.teams[0].name,
        laLigaBucks: response.teams[0].laLigaBucks,
        espnComponent: response.teams[0].espnComponent,
        cumulativeComponent: response.teams[0].cumulativeComponent
      });
    }
    
    return response;
  }

  /**
   * Get matchups for specific week and year
   */
  async getMatchups(week, year) {
    return this.get('/api/matchups', { week, season: year });
  }

  /**
   * Get all matchups for a year
   */
  async getAllMatchups(year) {
    return this.get('/api/matchups/all', { year });
  }

  /**
   * Get champions history
   */
  async getChampions() {
    return this.get('/api/history/champions');
  }

  /**
   * Get sacko history
   */
  async getSackos() {
    return this.get('/api/history/sackos');
  }

  /**
   * Get commentary
   */
  async getCommentary() {
    return this.get('/api/commentary');
  }

  /**
   * Get league settings
   */
  async getLeagueSettings(year) {
    return this.get('/api/league/settings', { year });
  }

  /**
   * Get team details
   */
  async getTeamDetails(teamId, year) {
    return this.get(`/api/teams/${teamId}`, { year });
  }

  /**
   * Get team progression data
   */
  async getTeamProgression(teamId, year) {
    return this.get(`/api/teams/${teamId}/progression`, { year });
  }

  /**
   * Get earnings data
   */
  async getEarnings(year) {
    return this.get('/api/earnings', { year });
  }

  /**
   * Get weekly high scores
   */
  async getWeeklyHighScores(year) {
    return this.get('/api/high-scores', { year });
  }

  /**
   * Admin API calls
   */
  
  /**
   * Admin login
   */
  async adminLogin(credentials) {
    return this.post('/api/admin/login', credentials);
  }

  /**
   * Admin logout
   */
  async adminLogout() {
    return this.post('/api/admin/logout');
  }

  /**
   * Get admin data
   */
  async getAdminData() {
    return this.get('/api/admin/data');
  }

  /**
   * Update admin data
   */
  async updateAdminData(data) {
    return this.put('/api/admin/data', data);
  }

  /**
   * Force data refresh
   */
  async forceRefresh() {
    return this.post('/api/admin/refresh');
  }

  /**
   * Export data
   */
  async exportData(type) {
    return this.get('/api/admin/export', { type });
  }

  /**
   * Import data
   */
  async importData(data) {
    return this.post('/api/admin/import', data);
  }

  /**
   * Add champion
   */
  async addChampion(year, winner) {
    return this.post('/api/admin/champions', { year, winner });
  }

  /**
   * Delete champion
   */
  async deleteChampion(year) {
    return this.delete(`/api/admin/champions/${year}`);
  }

  /**
   * Add sacko
   */
  async addSacko(year, loser) {
    return this.post('/api/admin/sackos', { year, loser });
  }

  /**
   * Delete sacko
   */
  async deleteSacko(year) {
    return this.delete(`/api/admin/sackos/${year}`);
  }

  /**
   * Authentication API calls
   */
  
  /**
   * Register user
   */
  async register(userData) {
    return this.post('/api/auth/register', userData);
  }

  /**
   * Login user
   */
  async login(credentials) {
    return this.post('/api/auth/login', credentials);
  }

  /**
   * Logout user
   */
  async logout() {
    return this.post('/api/auth/logout');
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    return this.post('/api/auth/forgot-password', { email });
  }

  /**
   * Reset password
   */
  async resetPassword(token, password) {
    return this.post('/api/auth/reset-password', { token, password });
  }

  /**
   * Utility methods
   */

  /**
   * Parse error response from API
   */
  async parseErrorResponse(response) {
    try {
      const errorData = await response.json();
      return errorData;
    } catch (parseError) {
      // If JSON parsing fails, return basic error info
      return {
        error: response.statusText,
        status: response.status,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Create structured API error
   */
  createAPIError(status, errorData, endpoint) {
    let message;
    
    switch (status) {
      case 400:
        message = `Bad request: ${errorData.error || 'Invalid parameters'}`;
        break;
      case 401:
        message = 'Authentication required';
        break;
      case 403:
        message = 'Access forbidden';
        break;
      case 404:
        message = `Data not found: ${endpoint}`;
        break;
      case 429:
        message = 'Too many requests - please try again later';
        break;
      case 500:
        message = `Server error: ${errorData.error || 'Internal server error'}`;
        break;
      case 502:
        message = 'Service temporarily unavailable';
        break;
      case 503:
        message = 'Service under maintenance';
        break;
      default:
        message = `HTTP error ${status}: ${errorData.error || 'Unknown error'}`;
    }
    
    const error = new Error(message);
    error.status = status;
    error.endpoint = endpoint;
    error.data = errorData;
    error.timestamp = new Date().toISOString();
    
    return error;
  }

  /**
   * Enhance error with additional context
   */
  enhanceError(error, endpoint) {
    if (!error.endpoint) {
      error.endpoint = endpoint;
    }
    
    if (!error.timestamp) {
      error.timestamp = new Date().toISOString();
    }
    
    // Add user-friendly message if not present
    if (!error.userMessage) {
      error.userMessage = this.getUserFriendlyMessage(error);
    }
    
    return error;
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error) {
    if (error.message.includes('timeout')) {
      return 'Request is taking too long. Please try again.';
    }
    
    if (error.message.includes('Network error')) {
      return 'Connection problem. Please check your internet and try again.';
    }
    
    if (error.message.includes('Data not found')) {
      return 'The requested information is not available.';
    }
    
    if (error.message.includes('Server error')) {
      return 'Server is experiencing issues. Please try again in a few minutes.';
    }
    
    if (error.message.includes('Authentication')) {
      return 'Please log in to access this feature.';
    }
    
    return 'Something went wrong. Please try again.';
  }

  /**
   * Handle API errors gracefully (legacy method - enhanced)
   */
  handleError(error, context = '') {
    console.error(`API Error ${context}:`, error);
    
    // Return enhanced error with user-friendly message
    return this.enhanceError(error, context);
  }

  /**
   * Retry request with exponential backoff and smart retry logic
   */
  async retryRequest(requestFn, maxRetries = 3, baseDelay = 1000) {
    const retryableErrors = [500, 502, 503, 504, 429]; // HTTP status codes that are retryable
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        const isLastAttempt = attempt === maxRetries - 1;
        const isRetryable = this.isRetryableError(error, retryableErrors);
        
        // Log retry attempt
        console.warn(`Request attempt ${attempt + 1}/${maxRetries} failed:`, {
          error: error.message,
          status: error.status,
          retryable: isRetryable
        });
        
        // Don't retry if it's the last attempt or error is not retryable
        if (isLastAttempt || !isRetryable) {
          throw this.enhanceError(error, `Failed after ${attempt + 1} attempts`);
        }
        
        // Calculate delay with jitter to prevent thundering herd
        const jitter = Math.random() * 0.3; // 0-30% jitter
        const delay = baseDelay * Math.pow(2, attempt) * (1 + jitter);
        
        console.info(`Retrying request in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error, retryableStatusCodes) {
    // Network errors are generally retryable
    if (error.message.includes('Network error') || error.message.includes('fetch')) {
      return true;
    }
    
    // Timeout errors are retryable
    if (error.message.includes('timeout') || error.name === 'AbortError') {
      return true;
    }
    
    // Check HTTP status codes
    if (error.status && retryableStatusCodes.includes(error.status)) {
      return true;
    }
    
    // Client errors (4xx) are generally not retryable, except 429 (rate limiting)
    if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
      return false;
    }
    
    return true; // Default to retryable for unknown errors
  }

  /**
   * Smart request wrapper with automatic retries for important endpoints
   */
  async smartRequest(endpoint, options = {}, retryOptions = {}) {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      retryImportantEndpoints = true
    } = retryOptions;
    
    // List of important endpoints that should always be retried
    const importantEndpoints = ['/api/teams', '/api/matchups', '/api/health'];
    const isImportantEndpoint = importantEndpoints.some(important => endpoint.includes(important));
    
    const requestFn = () => this.request(endpoint, options);
    
    if (retryImportantEndpoints && isImportantEndpoint) {
      console.info(`Making smart request to important endpoint: ${endpoint}`);
      return await this.retryRequest(requestFn, maxRetries, baseDelay);
    } else {
      // Single attempt for less critical endpoints
      return await requestFn();
    }
  }

  /**
   * Batch requests
   */
  async batchRequests(requests) {
    try {
      const results = await Promise.allSettled(requests);
      return results.map(result => 
        result.status === 'fulfilled' ? result.value : result.reason
      );
    } catch (error) {
      console.error('Batch request failed:', error);
      throw error;
    }
  }
}