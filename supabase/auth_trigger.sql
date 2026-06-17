-- Create a function that handles a new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
 insert into public.profiles (id, name, email, avatar_url)
 values (
  new.id,
  coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New User'),
  new.email,
  new.raw_user_meta_data->>'avatar_url'
 );
 return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created in auth.users
create or replace trigger on_auth_user_created
 after insert on auth.users
 for each row execute procedure public.handle_new_user();
