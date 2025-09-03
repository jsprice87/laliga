/**
 * Banner Service
 * Manages champions and sacko banners
 */

import { Logger } from '../utils/logger.js';

export class BannerService {
  constructor(state) {
    this.state = state;
    this.logger = new Logger('BannerService');
  }

  /**
   * Update all banners
   */
  updateBanners() {
    console.log('🏆 BannerService: Updating banners...');
    this.updateChampionsBanner();
    this.updateSackoBanner();
  }

  /**
   * Update champions banner
   */
  updateChampionsBanner() {
    const championsHistory = this.state.getChampionsHistory();
    const championsBanner = document.getElementById('champions-banner');
    
    console.log('🏆 Champions history:', championsHistory?.length || 0, 'entries');
    console.log('🏆 Champions banner element found:', !!championsBanner);
    
    if (!championsBanner) {
      console.error('❌ Champions banner element not found!');
      return;
    }

    // Filter out TBD entries and get actual champions
    const actualChampions = championsHistory.filter(champ => 
      champ.team && champ.team !== 'TBD' && champ.team.trim() !== ''
    );

    if (actualChampions.length === 0) {
      championsBanner.innerHTML = '<img src="https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/98e35486-b07f-4353-95ef-c032a1dc9655.png" class="banner-trophy" alt="Trophy"> CHAMPIONS: TBD <img src="https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/98e35486-b07f-4353-95ef-c032a1dc9655.png" class="banner-trophy" alt="Trophy">';
      return;
    }

    // Create champions list with trophy images between each winner
    let championsHtml = '<img src="assets/trophy-small.png" class="banner-trophy" alt="Trophy">';
    championsHtml += 'CHAMPIONS: ';
    championsHtml += actualChampions.map(champ => `${champ.year} ${champ.team}`).join(' <img src="assets/trophy-small.png" class="banner-trophy" alt="Trophy"> ');
    championsHtml += ' <img src="assets/trophy-small.png" class="banner-trophy" alt="Trophy">';

    championsBanner.innerHTML = championsHtml;
  }

  /**
   * Update sacko banner
   */
  updateSackoBanner() {
    const sackoHistory = this.state.getSackoHistory();
    const sackoBanner = document.getElementById('sacko-banner');
    
    console.log('💩 Sacko history:', sackoHistory?.length || 0, 'entries');  
    console.log('💩 Sacko banner element found:', !!sackoBanner);
    
    if (!sackoBanner) {
      console.error('❌ Sacko banner element not found!');
      return;
    }

    // Filter out TBD entries and get actual sackos
    const actualSackos = sackoHistory.filter(sacko => 
      sacko.team && sacko.team !== 'TBD' && sacko.team.trim() !== ''
    );

    if (actualSackos.length === 0) {
      sackoBanner.innerHTML = '▼ SACKO HALL OF SHAME: TBD ▼';
      return;
    }

    // Create sacko list with poop emoji between each loser
    let sackosHtml = '💩 SACKO HALL OF SHAME: ';
    sackosHtml += actualSackos.map(sacko => `${sacko.year} ${sacko.team}`).join(' 💩 ');
    sackosHtml += ' 💩';

    sackoBanner.innerHTML = sackosHtml;
  }
}