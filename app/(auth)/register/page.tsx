'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { register } from '@/app/lib/actions/auth-actions';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState<number>(0);

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character' };
    }
    
    return { valid: true };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message || 'Invalid password');
      setLoading(false);
      return;
    }

    const result = await register({ name, email, password });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      window.location.href = '/polls'; // Full reload to pick up session
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">Sign up to start creating and sharing polls</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                name="name"
                type="text" 
                placeholder="John Doe" 
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="your@email.com" 
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                required
                autoComplete="new-password"
                onChange={(e) => {
                  const value = e.target.value;
                  setPassword(value);
                  
                  // Calculate password strength
                  let strength = 0;
                  if (value.length >= 8) strength += 1;
                  if (/[A-Z]/.test(value)) strength += 1;
                  if (/[a-z]/.test(value)) strength += 1;
                  if (/[0-9]/.test(value)) strength += 1;
                  if (/[^A-Za-z0-9]/.test(value)) strength += 1;
                  
                  setPasswordStrength(strength);
                }}
              />
              {password && (
                <div className="mt-2">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${passwordStrength === 0 ? 'bg-red-500' : 
                          passwordStrength === 1 ? 'bg-red-500' : 
                          passwordStrength === 2 ? 'bg-orange-500' : 
                          passwordStrength === 3 ? 'bg-yellow-500' : 
                          passwordStrength === 4 ? 'bg-lime-500' : 'bg-green-500'}`} 
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-xs">
                      {passwordStrength === 0 ? 'Very weak' : 
                       passwordStrength === 1 ? 'Weak' : 
                       passwordStrength === 2 ? 'Fair' : 
                       passwordStrength === 3 ? 'Good' : 
                       passwordStrength === 4 ? 'Strong' : 'Very strong'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters with uppercase, lowercase, number, and special character.
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword"
                type="password" 
                required
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}