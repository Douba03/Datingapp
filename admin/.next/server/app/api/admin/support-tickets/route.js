"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/admin/support-tickets/route";
exports.ids = ["app/api/admin/support-tickets/route"];
exports.modules = {

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "punycode":
/*!***************************!*\
  !*** external "punycode" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("punycode");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fadmin%2Fsupport-tickets%2Froute&page=%2Fapi%2Fadmin%2Fsupport-tickets%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fsupport-tickets%2Froute.ts&appDir=C%3A%5CUsers%5Cqossai%5CDesktop%5Cpartner-productivity-app%5Cadmin%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cqossai%5CDesktop%5Cpartner-productivity-app%5Cadmin&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fadmin%2Fsupport-tickets%2Froute&page=%2Fapi%2Fadmin%2Fsupport-tickets%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fsupport-tickets%2Froute.ts&appDir=C%3A%5CUsers%5Cqossai%5CDesktop%5Cpartner-productivity-app%5Cadmin%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cqossai%5CDesktop%5Cpartner-productivity-app%5Cadmin&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_qossai_Desktop_partner_productivity_app_admin_app_api_admin_support_tickets_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/admin/support-tickets/route.ts */ \"(rsc)/./app/api/admin/support-tickets/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/admin/support-tickets/route\",\n        pathname: \"/api/admin/support-tickets\",\n        filename: \"route\",\n        bundlePath: \"app/api/admin/support-tickets/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\qossai\\\\Desktop\\\\partner-productivity-app\\\\admin\\\\app\\\\api\\\\admin\\\\support-tickets\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_qossai_Desktop_partner_productivity_app_admin_app_api_admin_support_tickets_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/admin/support-tickets/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZhZG1pbiUyRnN1cHBvcnQtdGlja2V0cyUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGYWRtaW4lMkZzdXBwb3J0LXRpY2tldHMlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZhZG1pbiUyRnN1cHBvcnQtdGlja2V0cyUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNxb3NzYWklNUNEZXNrdG9wJTVDcGFydG5lci1wcm9kdWN0aXZpdHktYXBwJTVDYWRtaW4lNUNhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPUMlM0ElNUNVc2VycyU1Q3Fvc3NhaSU1Q0Rlc2t0b3AlNUNwYXJ0bmVyLXByb2R1Y3Rpdml0eS1hcHAlNUNhZG1pbiZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDdUQ7QUFDcEk7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdIQUFtQjtBQUMzQztBQUNBLGNBQWMseUVBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxpRUFBaUU7QUFDekU7QUFDQTtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUN1SDs7QUFFdkgiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9wYXJ0bmVyLWFkbWluLWRhc2hib2FyZC8/NjQ3NSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCJDOlxcXFxVc2Vyc1xcXFxxb3NzYWlcXFxcRGVza3RvcFxcXFxwYXJ0bmVyLXByb2R1Y3Rpdml0eS1hcHBcXFxcYWRtaW5cXFxcYXBwXFxcXGFwaVxcXFxhZG1pblxcXFxzdXBwb3J0LXRpY2tldHNcXFxccm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2FkbWluL3N1cHBvcnQtdGlja2V0cy9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2FkbWluL3N1cHBvcnQtdGlja2V0c1wiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvYWRtaW4vc3VwcG9ydC10aWNrZXRzL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiQzpcXFxcVXNlcnNcXFxccW9zc2FpXFxcXERlc2t0b3BcXFxccGFydG5lci1wcm9kdWN0aXZpdHktYXBwXFxcXGFkbWluXFxcXGFwcFxcXFxhcGlcXFxcYWRtaW5cXFxcc3VwcG9ydC10aWNrZXRzXFxcXHJvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuY29uc3Qgb3JpZ2luYWxQYXRobmFtZSA9IFwiL2FwaS9hZG1pbi9zdXBwb3J0LXRpY2tldHMvcm91dGVcIjtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgc2VydmVySG9va3MsXG4gICAgICAgIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgb3JpZ2luYWxQYXRobmFtZSwgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fadmin%2Fsupport-tickets%2Froute&page=%2Fapi%2Fadmin%2Fsupport-tickets%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fsupport-tickets%2Froute.ts&appDir=C%3A%5CUsers%5Cqossai%5CDesktop%5Cpartner-productivity-app%5Cadmin%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cqossai%5CDesktop%5Cpartner-productivity-app%5Cadmin&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./app/api/admin/support-tickets/route.ts":
/*!************************************************!*\
  !*** ./app/api/admin/support-tickets/route.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET),\n/* harmony export */   PATCH: () => (/* binding */ PATCH)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/@supabase/supabase-js/dist/module/index.js\");\n\n\nconst supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__.createClient)(\"https://zfnwtnqwokwvuxxwxgsr.supabase.co\", process.env.SUPABASE_SERVICE_ROLE_KEY);\nasync function GET() {\n    try {\n        const { data: tickets, error } = await supabase.from(\"support_tickets_with_user\").select(\"*\").order(\"created_at\", {\n            ascending: false\n        });\n        if (error) {\n            console.error(\"[API] Error fetching tickets:\", error);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: error.message\n            }, {\n                status: 500\n            });\n        }\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            tickets\n        });\n    } catch (error) {\n        console.error(\"[API] Error:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: error.message\n        }, {\n            status: 500\n        });\n    }\n}\nasync function PATCH(request) {\n    try {\n        const body = await request.json();\n        const { ticketId, status, adminNotes } = body;\n        if (!ticketId || !status) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"Missing required fields\"\n            }, {\n                status: 400\n            });\n        }\n        const updateData = {\n            status,\n            updated_at: new Date().toISOString()\n        };\n        if (adminNotes !== undefined) {\n            updateData.admin_notes = adminNotes;\n        }\n        if (status === \"resolved\" || status === \"closed\") {\n            updateData.resolved_at = new Date().toISOString();\n        }\n        const { data, error } = await supabase.from(\"support_tickets\").update(updateData).eq(\"id\", ticketId).select().single();\n        if (error) {\n            console.error(\"[API] Error updating ticket:\", error);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: error.message\n            }, {\n                status: 500\n            });\n        }\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            ticket: data\n        });\n    } catch (error) {\n        console.error(\"[API] Error:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: error.message\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2FkbWluL3N1cHBvcnQtdGlja2V0cy9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQTJDO0FBQ1U7QUFFckQsTUFBTUUsV0FBV0QsbUVBQVlBLENBQzNCRSwwQ0FBb0MsRUFDcENBLFFBQVFDLEdBQUcsQ0FBQ0UseUJBQXlCO0FBR2hDLGVBQWVDO0lBQ3BCLElBQUk7UUFDRixNQUFNLEVBQUVDLE1BQU1DLE9BQU8sRUFBRUMsS0FBSyxFQUFFLEdBQUcsTUFBTVIsU0FDcENTLElBQUksQ0FBQyw2QkFDTEMsTUFBTSxDQUFDLEtBQ1BDLEtBQUssQ0FBQyxjQUFjO1lBQUVDLFdBQVc7UUFBTTtRQUUxQyxJQUFJSixPQUFPO1lBQ1RLLFFBQVFMLEtBQUssQ0FBQyxpQ0FBaUNBO1lBQy9DLE9BQU9WLHFEQUFZQSxDQUFDZ0IsSUFBSSxDQUFDO2dCQUFFTixPQUFPQSxNQUFNTyxPQUFPO1lBQUMsR0FBRztnQkFBRUMsUUFBUTtZQUFJO1FBQ25FO1FBRUEsT0FBT2xCLHFEQUFZQSxDQUFDZ0IsSUFBSSxDQUFDO1lBQUVQO1FBQVE7SUFDckMsRUFBRSxPQUFPQyxPQUFZO1FBQ25CSyxRQUFRTCxLQUFLLENBQUMsZ0JBQWdCQTtRQUM5QixPQUFPVixxREFBWUEsQ0FBQ2dCLElBQUksQ0FBQztZQUFFTixPQUFPQSxNQUFNTyxPQUFPO1FBQUMsR0FBRztZQUFFQyxRQUFRO1FBQUk7SUFDbkU7QUFDRjtBQUVPLGVBQWVDLE1BQU1DLE9BQWdCO0lBQzFDLElBQUk7UUFDRixNQUFNQyxPQUFPLE1BQU1ELFFBQVFKLElBQUk7UUFDL0IsTUFBTSxFQUFFTSxRQUFRLEVBQUVKLE1BQU0sRUFBRUssVUFBVSxFQUFFLEdBQUdGO1FBRXpDLElBQUksQ0FBQ0MsWUFBWSxDQUFDSixRQUFRO1lBQ3hCLE9BQU9sQixxREFBWUEsQ0FBQ2dCLElBQUksQ0FDdEI7Z0JBQUVOLE9BQU87WUFBMEIsR0FDbkM7Z0JBQUVRLFFBQVE7WUFBSTtRQUVsQjtRQUVBLE1BQU1NLGFBQWtCO1lBQ3RCTjtZQUNBTyxZQUFZLElBQUlDLE9BQU9DLFdBQVc7UUFDcEM7UUFFQSxJQUFJSixlQUFlSyxXQUFXO1lBQzVCSixXQUFXSyxXQUFXLEdBQUdOO1FBQzNCO1FBRUEsSUFBSUwsV0FBVyxjQUFjQSxXQUFXLFVBQVU7WUFDaERNLFdBQVdNLFdBQVcsR0FBRyxJQUFJSixPQUFPQyxXQUFXO1FBQ2pEO1FBRUEsTUFBTSxFQUFFbkIsSUFBSSxFQUFFRSxLQUFLLEVBQUUsR0FBRyxNQUFNUixTQUMzQlMsSUFBSSxDQUFDLG1CQUNMb0IsTUFBTSxDQUFDUCxZQUNQUSxFQUFFLENBQUMsTUFBTVYsVUFDVFYsTUFBTSxHQUNOcUIsTUFBTTtRQUVULElBQUl2QixPQUFPO1lBQ1RLLFFBQVFMLEtBQUssQ0FBQyxnQ0FBZ0NBO1lBQzlDLE9BQU9WLHFEQUFZQSxDQUFDZ0IsSUFBSSxDQUFDO2dCQUFFTixPQUFPQSxNQUFNTyxPQUFPO1lBQUMsR0FBRztnQkFBRUMsUUFBUTtZQUFJO1FBQ25FO1FBRUEsT0FBT2xCLHFEQUFZQSxDQUFDZ0IsSUFBSSxDQUFDO1lBQUVrQixRQUFRMUI7UUFBSztJQUMxQyxFQUFFLE9BQU9FLE9BQVk7UUFDbkJLLFFBQVFMLEtBQUssQ0FBQyxnQkFBZ0JBO1FBQzlCLE9BQU9WLHFEQUFZQSxDQUFDZ0IsSUFBSSxDQUFDO1lBQUVOLE9BQU9BLE1BQU1PLE9BQU87UUFBQyxHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUNuRTtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcGFydG5lci1hZG1pbi1kYXNoYm9hcmQvLi9hcHAvYXBpL2FkbWluL3N1cHBvcnQtdGlja2V0cy9yb3V0ZS50cz8yMzAyIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gJ25leHQvc2VydmVyJztcclxuaW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJztcclxuXHJcbmNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KFxyXG4gIHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NVUEFCQVNFX1VSTCEsXHJcbiAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWSFcclxuKTtcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQoKSB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgZGF0YTogdGlja2V0cywgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgIC5mcm9tKCdzdXBwb3J0X3RpY2tldHNfd2l0aF91c2VyJylcclxuICAgICAgLnNlbGVjdCgnKicpXHJcbiAgICAgIC5vcmRlcignY3JlYXRlZF9hdCcsIHsgYXNjZW5kaW5nOiBmYWxzZSB9KTtcclxuXHJcbiAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcignW0FQSV0gRXJyb3IgZmV0Y2hpbmcgdGlja2V0czonLCBlcnJvcik7XHJcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0sIHsgc3RhdHVzOiA1MDAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgdGlja2V0cyB9KTtcclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdbQVBJXSBFcnJvcjonLCBlcnJvcik7XHJcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9LCB7IHN0YXR1czogNTAwIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBBVENIKHJlcXVlc3Q6IFJlcXVlc3QpIHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgYm9keSA9IGF3YWl0IHJlcXVlc3QuanNvbigpO1xyXG4gICAgY29uc3QgeyB0aWNrZXRJZCwgc3RhdHVzLCBhZG1pbk5vdGVzIH0gPSBib2R5O1xyXG5cclxuICAgIGlmICghdGlja2V0SWQgfHwgIXN0YXR1cykge1xyXG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oXHJcbiAgICAgICAgeyBlcnJvcjogJ01pc3NpbmcgcmVxdWlyZWQgZmllbGRzJyB9LFxyXG4gICAgICAgIHsgc3RhdHVzOiA0MDAgfVxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHVwZGF0ZURhdGE6IGFueSA9IHtcclxuICAgICAgc3RhdHVzLFxyXG4gICAgICB1cGRhdGVkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICB9O1xyXG5cclxuICAgIGlmIChhZG1pbk5vdGVzICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgdXBkYXRlRGF0YS5hZG1pbl9ub3RlcyA9IGFkbWluTm90ZXM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHN0YXR1cyA9PT0gJ3Jlc29sdmVkJyB8fCBzdGF0dXMgPT09ICdjbG9zZWQnKSB7XHJcbiAgICAgIHVwZGF0ZURhdGEucmVzb2x2ZWRfYXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgLmZyb20oJ3N1cHBvcnRfdGlja2V0cycpXHJcbiAgICAgIC51cGRhdGUodXBkYXRlRGF0YSlcclxuICAgICAgLmVxKCdpZCcsIHRpY2tldElkKVxyXG4gICAgICAuc2VsZWN0KClcclxuICAgICAgLnNpbmdsZSgpO1xyXG5cclxuICAgIGlmIChlcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdbQVBJXSBFcnJvciB1cGRhdGluZyB0aWNrZXQ6JywgZXJyb3IpO1xyXG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9LCB7IHN0YXR1czogNTAwIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IHRpY2tldDogZGF0YSB9KTtcclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdbQVBJXSBFcnJvcjonLCBlcnJvcik7XHJcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9LCB7IHN0YXR1czogNTAwIH0pO1xyXG4gIH1cclxufVxyXG5cclxuIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsImNyZWF0ZUNsaWVudCIsInN1cGFiYXNlIiwicHJvY2VzcyIsImVudiIsIk5FWFRfUFVCTElDX1NVUEFCQVNFX1VSTCIsIlNVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVkiLCJHRVQiLCJkYXRhIiwidGlja2V0cyIsImVycm9yIiwiZnJvbSIsInNlbGVjdCIsIm9yZGVyIiwiYXNjZW5kaW5nIiwiY29uc29sZSIsImpzb24iLCJtZXNzYWdlIiwic3RhdHVzIiwiUEFUQ0giLCJyZXF1ZXN0IiwiYm9keSIsInRpY2tldElkIiwiYWRtaW5Ob3RlcyIsInVwZGF0ZURhdGEiLCJ1cGRhdGVkX2F0IiwiRGF0ZSIsInRvSVNPU3RyaW5nIiwidW5kZWZpbmVkIiwiYWRtaW5fbm90ZXMiLCJyZXNvbHZlZF9hdCIsInVwZGF0ZSIsImVxIiwic2luZ2xlIiwidGlja2V0Il0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/admin/support-tickets/route.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@supabase","vendor-chunks/tr46","vendor-chunks/whatwg-url","vendor-chunks/webidl-conversions"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fadmin%2Fsupport-tickets%2Froute&page=%2Fapi%2Fadmin%2Fsupport-tickets%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fsupport-tickets%2Froute.ts&appDir=C%3A%5CUsers%5Cqossai%5CDesktop%5Cpartner-productivity-app%5Cadmin%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cqossai%5CDesktop%5Cpartner-productivity-app%5Cadmin&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();