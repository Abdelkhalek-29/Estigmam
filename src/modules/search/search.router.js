import { Router } from "express";
import * as searchController from "../search/controller/search.js";

import auth from "../../middleware/auth.js";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import optionalAuth from "../../middleware/optionalAuth.js";

const router = Router();

router.get("/", optionalAuth, searchController.search);
router.post(
  "/save/:searchId",
  auth,
  isAuthorized("user"),
  searchController.saveSearchResult
);
router.get("/recentSearches", auth, searchController.getRecentSearches);

// Map user 
// Search berth by name
router.get("/searchBerth",auth, searchController.searchBerth);

// Save search result
router.post("/saveSearch/:berthId",auth,searchController.saveSearchResultBerth);

// Get newest 4 search results
router.get("/history",auth, searchController.getSearchHistory);

export default router;
