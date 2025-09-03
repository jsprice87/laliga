/**
 * Migration Controller - Database schema migration and fixes
 */

const { 
  initializeNewDatabase, 
  populateTeamsMaster, 
  migrateTeamsToWeeklyStandings,
  getWeeklyStandings 
} = require('../database/newSchemas');

class MigrationController {
  /**
   * Run complete database migration to new schema
   * POST /api/migrate/run-full-migration
   */
  static async runFullMigration(req, res) {
    try {
      console.log('🚀 Starting full database migration...');
      
      // Step 1: Initialize new database structure
      console.log('Step 1: Initializing new database collections...');
      await initializeNewDatabase();
      
      // Step 2: Populate teams master with owner names
      console.log('Step 2: Populating teams master with owner names...');
      const masterResult = await populateTeamsMaster();
      
      // Step 3: Migrate existing data to weekly standings
      console.log('Step 3: Migrating teams data to weekly standings...');
      const migrationResult = await migrateTeamsToWeeklyStandings();
      
      // Step 4: Test the new data structure
      console.log('Step 4: Testing new data structure...');
      const testData = await getWeeklyStandings(2024, 14);
      
      console.log('✅ Full migration completed successfully!');
      
      return res.status(200).json({
        success: true,
        message: 'Database migration completed successfully',
        results: {
          teamsMaster: {
            upserted: masterResult?.upsertedCount || 0,
            modified: masterResult?.modifiedCount || 0
          },
          weeklyStandings: {
            upserted: migrationResult?.upsertedCount || 0,
            modified: migrationResult?.modifiedCount || 0
          },
          testDataCount: testData?.length || 0
        },
        testPreview: testData?.slice(0, 3).map(team => ({
          name: team.name,
          owner: team.owner,
          ligaBucks: team.laLigaBucks,
          record: team.record
        })),
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Migration failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Test new weekly standings endpoint
   * GET /api/migrate/test-weekly-standings?season=2024&week=14
   */
  static async testWeeklyStandings(req, res) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const { season = 2024, week = 14 } = Object.fromEntries(url.searchParams);
      
      console.log(`🧪 Testing weekly standings for ${season} week ${week}`);
      
      const standings = await getWeeklyStandings(season, week);
      
      if (standings.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No weekly standings found for ${season} week ${week}`,
          season: parseInt(season),
          week: parseInt(week)
        });
      }
      
      return res.status(200).json({
        success: true,
        season: parseInt(season),
        week: parseInt(week),
        count: standings.length,
        standings: standings,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Test weekly standings failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Test failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Initialize just the new collections (without migration)
   * POST /api/migrate/init-collections
   */
  static async initCollections(req, res) {
    try {
      console.log('🔧 Initializing new database collections...');
      
      await initializeNewDatabase();
      
      return res.status(200).json({
        success: true,
        message: 'New database collections initialized successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Collection initialization failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Collection initialization failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Populate teams master only
   * POST /api/migrate/populate-teams-master
   */
  static async populateTeamsMasterOnly(req, res) {
    try {
      console.log('👥 Populating teams master collection...');
      
      const result = await populateTeamsMaster();
      
      return res.status(200).json({
        success: true,
        message: 'Teams master populated successfully',
        results: {
          upserted: result?.upsertedCount || 0,
          modified: result?.modifiedCount || 0
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Teams master population failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Teams master population failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = MigrationController;