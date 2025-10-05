/**
 * Export all MCP tools
 */

export { searchNSFAwardsTool } from './search-awards.js';
export { getAwardDetailsTool } from './get-award-details.js';
export { getProjectOutcomesTool } from './get-project-outcomes.js';
export { searchByInstitutionTool } from './search-by-institution.js';
export { searchByPITool } from './search-by-pi.js';

import { searchNSFAwardsTool } from './search-awards.js';
import { getAwardDetailsTool } from './get-award-details.js';
import { getProjectOutcomesTool } from './get-project-outcomes.js';
import { searchByInstitutionTool } from './search-by-institution.js';
import { searchByPITool } from './search-by-pi.js';

/**
 * All available MCP tools for NSF Awards
 */
export const allTools = [
  searchNSFAwardsTool,
  getAwardDetailsTool,
  getProjectOutcomesTool,
  searchByInstitutionTool,
  searchByPITool
];