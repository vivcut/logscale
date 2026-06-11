-- Function to automatically increment/decrement upvotes_count on post updates
create or replace function public.handle_upvote_counters()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.posts 
    set upvotes_count = upvotes_count + 1 
    where id = new.post_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.posts 
    set upvotes_count = upvotes_count - 1 
    where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Trigger attached to the upvotes table
create or replace trigger on_upvote_change
  after insert or delete on public.upvotes
  for each row execute procedure public.handle_upvote_counters();
