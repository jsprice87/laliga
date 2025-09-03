/**
 * Commentary Component
 * Handles league commentary display
 */

import { Logger } from '../utils/logger.js';

export class Commentary {
  constructor(state) {
    this.state = state;
    this.logger = new Logger('Commentary');
  }

  init() {
    this.logger.component('Commentary', 'initialized');
  }

  render() {
    const container = document.getElementById('commentary-container');
    if (!container) return;

    const commentary = this.state.getCommentary();
    
    if (commentary.length === 0) {
      container.innerHTML = this.renderEmptyState();
      return;
    }

    container.innerHTML = commentary.map((comment, index) => 
      this.createCommentaryItem(comment, index)
    ).join('');
  }

  createCommentaryItem(comment, index) {
    return `
      <div class="commentary-item game-panel">
        <div class="commentary-header">
          <span class="commentary-index">#${index + 1}</span>
          <span class="commentary-date">Week Update</span>
        </div>
        <div class="commentary-text">${comment}</div>
      </div>
    `;
  }

  renderEmptyState() {
    const currentYear = this.state.getCurrentYear();
    const message = currentYear === 2025 
      ? 'Season not started - commentary will appear here once games begin'
      : 'No commentary available for this season';

    return `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-message">${message}</div>
      </div>
    `;
  }

  refresh() {
    this.render();
  }
}