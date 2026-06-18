-- ============================================================
-- 0005_category.sql
-- Business Category — a short, user-friendly classification on top of
-- the granular free-text `sector`. Controlled vocabulary, editable in-app.
-- ============================================================

alter table organizations add column if not exists category text not null default 'Other';
create index if not exists idx_org_category on organizations (category);

-- One-off backfill from the existing sector/name (run once; safe to re-run).
update organizations set category = case
  when lower(coalesce(sector,'')||' '||coalesce(name,'')) ~ '(restaurant|cafe|coffee|\mpub\M|\mbar\M|brew|catering|\mfood\M|hospitality)' then 'Hospitality'
  when lower(coalesce(sector,'')||' '||coalesce(name,'')) ~ '(fitness|wellness|\mgym\M|\mcare\M|health|veterin|beauty|salon|dental|therap)' then 'Health & Wellbeing'
  when lower(coalesce(sector,'')||' '||coalesce(name,'')) ~ '(auto|motor|garage|vehicle)' then 'Automotive'
  when lower(coalesce(sector,'')||' '||coalesce(name,'')) ~ '(property|letting|estate agent|\mrent)' then 'Property'
  when lower(coalesce(sector,'')||' '||coalesce(name,'')) ~ '(retail|\mshop\M|\mstore\M|florist|flower)' then 'Retail'
  when lower(coalesce(sector,'')||' '||coalesce(name,'')) ~ '(tech|software|digital|\mweb\M|design|\mmedia\M|\mprint|creative|marketing)' then 'Technology & Creative'
  when lower(coalesce(sector,'')||' '||coalesce(name,'')) ~ '(account|consult|legal|solicit|survey|chartered|financ)' then 'Professional Services'
  when lower(coalesce(sector,'')||' '||coalesce(name,'')) ~ '(build|electric|plumb|roof|landscap|garden|joiner|carpent|plaster|render|scaffold|glaz|window|door|driveway|\mpav|groundwork|\mtree|forestry|decorat|paint|tile|\mgas\M|heat|renewable|solar|\mgate|stair|chimney|construction|home improvement|\mloft|maintenance|bathroom|kitchen|fitter|contractor)' then 'Construction & Trades'
  else 'Other'
end;
