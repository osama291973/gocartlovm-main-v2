import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const AccountDialog: React.FC<Props> = ({ open, onOpenChange }) => {
	const { user } = useAuth();
	const { toast } = useToast();
	const [loading, setLoading] = useState(false);
	const [fullName, setFullName] = useState('');
	const [avatarUrl, setAvatarUrl] = useState('');
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (user) {
			const metadata = (user.user_metadata as any) || {};
			setFullName(metadata.full_name || '');
			setAvatarUrl(metadata.avatar_url || '');
		}
	}, [user, open]);

	const handleSave = async () => {
		if (!user) return;
		setLoading(true);
		try {
			// Update auth user metadata (so header displays updated name/avatar)
			const { error: authError } = await supabase.auth.updateUser({ data: { full_name: fullName, avatar_url: avatarUrl } });
			if (authError) throw authError;

			// Ensure profile row exists/updated. include id = user.id to satisfy RLS policies that check auth.uid()
			const { error: upsertError } = await (supabase as any).from('profiles').upsert({ id: user.id, full_name: fullName, avatar_url: avatarUrl });
			if (upsertError) throw upsertError;

			toast({ title: 'Profile saved', description: 'Your profile was updated' });
			onOpenChange(false);
		} catch (e: any) {
			console.error('Profile save error', e);
			toast({ title: 'Error', description: e.message || 'Failed to save profile', variant: 'destructive' });
		} finally {
			setLoading(false);
		}
	};

	const handleFileSelect = async (file: File | null) => {
		if (!file || !user) return;
		setUploading(true);
		try {
			// Basic validation
			if (!file.type.startsWith('image/')) throw new Error('Please select an image file');
			const fileExt = file.name.split('.').pop();
			const filePath = `avatars/${user.id}/${Date.now()}.${fileExt}`;

			// Upload to Supabase Storage (bucket: 'avatars'). Make sure the bucket exists in your Supabase project.
			const storage = (supabase as any).storage;
			const { error: uploadError } = await storage.from('avatars').upload(filePath, file, { upsert: true });
			if (uploadError) throw uploadError;

			// Get public URL
			const { data: publicData } = await storage.from('avatars').getPublicUrl(filePath);
			const publicUrl = publicData?.publicUrl || publicData?.public_url || '';

			if (!publicUrl) throw new Error('Failed to get public url for uploaded avatar');

			setAvatarUrl(publicUrl);
			toast({ title: 'Uploaded', description: 'Avatar uploaded' });
		} catch (e: any) {
			console.error('Upload error', e);
			toast({ title: 'Upload failed', description: e.message || 'Could not upload image', variant: 'destructive' });
		} finally {
			setUploading(false);
		}
	};

	const onChooseFile = () => fileInputRef.current?.click();

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files && e.target.files[0];
		if (file) handleFileSelect(file);
	};

	const handleRemoveAvatar = async () => {
		if (!user || !avatarUrl) {
			setAvatarUrl('');
			return;
		}
		try {
			// Attempt to remove the file from storage if it was uploaded to our avatars bucket
			// This is conservative: only remove if URL includes `/avatars/` path
			const storage = (supabase as any).storage;
			const urlPath = avatarUrl;
			if (urlPath.includes('/avatars/')) {
				// extract path after bucket domain
				const parts = urlPath.split('/avatars/');
				if (parts[1]) {
					const path = `avatars/${parts[1]}`;
					await storage.from('avatars').remove([path]);
				}
			}
		} catch (e) {
			// ignore removal errors
			console.warn('Failed to remove avatar from storage', e);
		}
		setAvatarUrl('');
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl">
				<DialogHeader>
					<DialogTitle>Account</DialogTitle>
					<DialogDescription>Manage your account info.</DialogDescription>
				</DialogHeader>

				<div className="grid grid-cols-12 gap-6 py-4">
					{/* Left sidebar navigation */}
					<div className="col-span-4 border-r pr-4">
						<nav className="space-y-2">
							<button className="w-full text-left rounded px-3 py-2 bg-muted/20">Profile</button>
							<button className="w-full text-left rounded px-3 py-2 hover:bg-muted/10">Security</button>
							<button className="w-full text-left rounded px-3 py-2 hover:bg-muted/10">Billing</button>
						</nav>

						<div className="mt-6 text-sm text-muted-foreground">Development mode</div>
					</div>

					{/* Right content */}
					<div className="col-span-8">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold">Profile details</h3>
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-3">
									<Avatar className="h-14 w-14">
										{avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName || 'avatar'} /> : <AvatarFallback>{(fullName || user?.email || 'U').charAt(0)}</AvatarFallback>}
									</Avatar>
									<div className="flex flex-col">
										<div className="text-sm font-medium">{fullName || '—'}</div>
										<div className="text-xs text-muted-foreground">{user?.email}</div>
									</div>
								</div>

								<div className="flex items-center gap-2">
									<input ref={fileInputRef} onChange={handleFileChange} type="file" accept="image/*" className="hidden" />
									<Button size="sm" onClick={onChooseFile} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</Button>
									<Button size="sm" variant="ghost" onClick={handleRemoveAvatar}>Remove</Button>
								</div>
							</div>
						</div>

						<div className="mt-6 grid grid-cols-1 gap-4">
							<div>
								<label className="text-sm font-medium">Full name</label>
								<Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
							</div>

							<div>
								<label className="text-sm font-medium">Avatar URL</label>
								<Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
							</div>

							<div>
								<label className="text-sm font-medium">Bio</label>
								<Textarea placeholder="Short bio (optional)" />
							</div>

							<div className="pt-2">
								<div className="text-sm font-medium">Email addresses</div>
								<div className="text-sm text-muted-foreground">{user?.email}</div>
								<div className="mt-2 text-sm text-muted-foreground">Connected accounts</div>
								<div className="text-sm">Google • {user?.email}</div>
							</div>
						</div>

						<DialogFooter className="mt-6">
							<Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
							<Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Update profile'}</Button>
						</DialogFooter>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default AccountDialog;
