/**
 * Rules Component
 * Displays league rules (static content)
 */

import { Logger } from '../utils/logger.js';

export class Rules {
  constructor() {
    this.logger = new Logger('Rules');
  }

  init() {
    this.logger.component('Rules', 'initialized');
  }

  render() {
    // Rules are static content in HTML, no dynamic rendering needed
    this.logger.debug('Rules component rendered (static content)');
  }

  refresh() {
    // No dynamic content to refresh
  }
}