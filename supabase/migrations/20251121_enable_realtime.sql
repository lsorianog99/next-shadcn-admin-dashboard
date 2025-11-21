-- Enable Realtime for messaging tables
-- Date: 2025-11-21
-- Context: Frontend uses Supabase Realtime to display new messages, but tables might not be in the publication.

-- 1. Enable Realtime for 'messages' table
begin;
  -- Check if table is already in publication, if not add it
  do $$
  begin
    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' 
      and tablename = 'messages'
    ) then
      alter publication supabase_realtime add table messages;
    end if;
  end
  $$;
commit;

-- 2. Enable Realtime for 'chats' table
begin;
  do $$
  begin
    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' 
      and tablename = 'chats'
    ) then
      alter publication supabase_realtime add table chats;
    end if;
  end
  $$;
commit;

-- 3. Verify RLS for SELECT allows users to see their messages
-- (Already covered by previous migration, but good to double check)
-- The policy "Allow authenticated users to select messages" should exist.
