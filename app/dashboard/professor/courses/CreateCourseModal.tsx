'use client';

import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated: () => void;
}

const courseColors = [
  { name: 'Blue', value: '#4285F4' },
  { name: 'Green', value: '#34A853' },
  { name: 'Yellow', value: '#FBBC04' },
  { name: 'Red', value: '#EA4335' },
  { name: 'Purple', value: '#9C27B0' },
  { name: 'Orange', value: '#FF9800' },
  { name: 'Cyan', value: '#00BCD4' },
  { name: 'Pink', value: '#E91E63' },
];

export function CreateCourseModal({ isOpen, onClose, onCourseCreated }: CreateCourseModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    room: '',
    color: courseColors[0].value,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('You must be logged in to create a course');
      }

      // Generate class code - try database function first, fallback to client-side
      let classCode: string;

      try {
        const { data: codeData, error: codeError } = await supabase
          .rpc('generate_class_code');

        if (codeError || !codeData) {
          throw new Error('RPC failed, using fallback');
        }

        classCode = codeData;
      } catch (rpcError) {
        // Fallback: generate a 6-character alphanumeric code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        classCode = '';
        for (let i = 0; i < 6; i++) {
          classCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Check if code exists (simple check, might have race condition but acceptable)
        const { data: existing } = await supabase
          .from('courses')
          .select('id')
          .eq('class_code', classCode)
          .single();

        if (existing) {
          // If exists, add a number suffix
          classCode = classCode.substring(0, 5) + Math.floor(Math.random() * 10);
        }
      }

      // Create the course using RPC function (bypasses RLS)
      const { data, error: rpcError } = await supabase
        .rpc('create_course', {
          p_name: formData.name,
          p_description: formData.description || null,
          p_subject: formData.subject || null,
          p_room: formData.room || null,
          p_color: formData.color,
          p_class_code: classCode,
        });

      if (rpcError) {
        throw rpcError;
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error('Failed to create course');
      }

      // RPC returns array, get first item
      const course = Array.isArray(data) ? data[0] : data;

      if (!course) {
        throw new Error('Course was not created');
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        subject: '',
        room: '',
        color: courseColors[0].value,
      });

      onCourseCreated();
      onClose();
    } catch (err: unknown) {
      console.error('Error creating course:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create course. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-card rounded-xl border border-border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Create Course</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Course Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Introduction to Computer Science"
              required
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-2">
              Subject
            </label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g., Computer Science"
            />
          </div>

          <div>
            <label htmlFor="room" className="block text-sm font-medium mb-2">
              Room
            </label>
            <Input
              id="room"
              name="room"
              value={formData.room}
              onChange={handleChange}
              placeholder="e.g., Room 101"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Course description..."
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Course Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {courseColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${formData.color === color.value
                    ? 'border-foreground scale-110'
                    : 'border-border hover:border-foreground/50'
                    }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Creating...' : 'Create Course'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

