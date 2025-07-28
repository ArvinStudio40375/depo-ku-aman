-- Create users table for banking app
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL,
  saldo_tabungan BIGINT NOT NULL DEFAULT 0,
  saldo_deposito BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Insert default user
INSERT INTO public.users (username, pin, saldo_tabungan, saldo_deposito) 
VALUES ('Siti Aminah', '112233', 617000, 25000000);

-- Create policies for users table
CREATE POLICY "Users can view their own data" 
ON public.users 
FOR SELECT 
USING (username = current_setting('app.current_user'::text, true));

CREATE POLICY "Users can update their own data" 
ON public.users 
FOR UPDATE 
USING (username = current_setting('app.current_user'::text, true));

CREATE POLICY "Admin can view all data" 
ON public.users 
FOR ALL 
USING (current_setting('app.user_role'::text, true) = 'admin');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();