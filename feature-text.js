(function(){
'use strict';
const EN={
  "setup": "Simple Setup uses the normal RV defaults. Custom Setup lets you match the facilities and RV Components you actually own.",
  "goal": "Choose what the planner should prioritize while it keeps the required RV upgrade materials running.",
  "workers": "Minimum uses the lowest valid trait level. Trait Level 3 is the recommended default. Lv.4 uses the best verified workers.",
  "results": "Use the result sections to see what to grow, produce, sell, and which Aniimos and support facilities are needed.",
  "produce": "Use the result sections to see what to grow, produce, craft and the used facilities.",
  "sell": "Everything in \"Sell This\" can be freely sold; basic ingredients there are either overproduced or not used in any recipe. Seeds Needed is calculated for the set plan duration, and buying more is also fine.",
  "event": "Event Center keeps seasonal tools separate from the normal production plan.",
  "orders": "Order Solver handles temporary orders without replacing the permanent production plan.",
  "floor": "Floor Planner turns the current plan into a layout. Changes made while it is open redeploy automatically; Reverse Layout restores one of the last five layouts.",
  "next": "Next RV compares the resources you own with the upgrade requirements. It can also show the GAME050TOKEN cost of newly unlocked facility upgrades.",
  "category": "Set the exact counts and levels you actually own in this category. Values are limited to what your selected RV can unlock.",
  "price": "Facility upgrades cost the same as buying that facility at the target level. If count and level increase together, every facility is priced at the new level."
};
function t(key,fallback=''){const locale=window.AniilandI18n?.getLanguage?.()||'en-US';return window.AniilandV2Text?.resolveGame?.(window.AniilandLocales?.[locale]?.feature?.[key]??EN[key]??fallback)??fallback;}
window.AniilandFeatureText={t,text:{en:EN}};
})();
