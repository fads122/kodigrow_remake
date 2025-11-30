'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { FileText, Upload, Trash2, Download, Search, Plus, X, AlertCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    account_type?: string;
  };
}

interface Course {
  id: string;
  name: string;
  subject: string;
  color: string;
}

interface LearningMaterial {
  id: string;
  student_id: string;
  title: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  course_id: string | null;
  created_at: string;
  updated_at: string;
  course?: Course | null;
}

export default function LearningMaterialsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<LearningMaterial | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    courseId: '',
    file: null as File | null,
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const accountType = user.user_metadata?.account_type;
      if (accountType === 'professor') {
        router.push('/dashboard/professor');
        return;
      }

      setUser(user);
      await Promise.all([
        fetchCourses(user.id),
        fetchMaterials(user.id)
      ]);
      setLoading(false);
    };

    getUser();
  }, [router]);

  const fetchCourses = async (studentId: string) => {
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .rpc('get_student_courses');

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        setCourses([]);
        return;
      }

      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const fetchMaterials = async (studentId: string) => {
    try {
      const { data: materialsData, error: materialsError } = await supabase
        .from('learning_materials')
        .select(`
          *,
          course:courses(id, name, subject, color)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (materialsError) {
        console.error('Error fetching materials:', materialsError);
        setMaterials([]);
        return;
      }

      const transformedMaterials: LearningMaterial[] = (materialsData || []).map((material: any) => ({
        id: material.id,
        student_id: material.student_id,
        title: material.title,
        description: material.description,
        file_name: material.file_name,
        file_path: material.file_path,
        file_size: material.file_size,
        file_type: material.file_type,
        course_id: material.course_id,
        created_at: material.created_at,
        updated_at: material.updated_at,
        course: material.course || undefined,
      }));

      setMaterials(transformedMaterials);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setMaterials([]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setUploadError('Only PDF files are allowed');
        return;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setUploadError('File size must be less than 50MB');
        return;
      }
      setUploadForm({ ...uploadForm, file, title: file.name.replace('.pdf', '') });
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!user || !uploadForm.file) {
      setUploadError('Please select a file');
      return;
    }

    if (!uploadForm.title.trim()) {
      setUploadError('Please enter a title');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Generate unique file path (bucket name is already specified in .from())
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('learning-materials')
        .upload(filePath, uploadForm.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('learning_materials')
        .insert({
          student_id: user.id,
          title: uploadForm.title.trim(),
          description: uploadForm.description.trim() || null,
          file_name: uploadForm.file.name,
          file_path: filePath,
          file_size: uploadForm.file.size,
          file_type: uploadForm.file.type,
          course_id: uploadForm.courseId || null,
        });

      if (dbError) {
        // If database insert fails, delete the uploaded file
        await supabase.storage
          .from('learning-materials')
          .remove([filePath]);
        throw dbError;
      }

      // Reset form and refresh materials
      setUploadForm({
        title: '',
        description: '',
        courseId: '',
        file: null,
      });
      setIsUploadModalOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await fetchMaterials(user.id);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setUploadError(error.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this learning material?')) {
      return;
    }

    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('learning-materials')
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }

      // Delete record from database
      const { error: dbError } = await supabase
        .from('learning_materials')
        .delete()
        .eq('id', materialId);

      if (dbError) {
        throw dbError;
      }

      // Remove from state
      setMaterials(materials.filter(m => m.id !== materialId));
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Failed to delete learning material. Please try again.');
    }
  };

  const handleView = async (material: LearningMaterial) => {
    setLoadingPdf(true);
    setViewingMaterial(material);
    
    try {
      // Get a signed URL for the PDF (valid for 1 hour)
      const { data, error } = await supabase.storage
        .from('learning-materials')
        .createSignedUrl(material.file_path, 3600);

      if (error) {
        throw error;
      }

      if (data) {
        setPdfUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Failed to load PDF. Please try again.');
      setViewingMaterial(null);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleCloseViewer = () => {
    setViewingMaterial(null);
    setPdfUrl(null);
  };

  const handleDownload = async (material: LearningMaterial) => {
    try {
      const { data, error } = await supabase.storage
        .from('learning-materials')
        .download(material.file_path);

      if (error) {
        throw error;
      }

      // Create download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.file_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse = selectedCourse === 'all' || material.course_id === selectedCourse;

    return matchesSearch && matchesCourse;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Learning Materials</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload and manage your PDF learning materials
          </p>
        </div>
        <motion.button
          whileHover={{ y: -1 }}
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Upload PDF
        </motion.button>
      </div>

      <Separator />

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-sm"
          />
        </div>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-sm"
        >
          <option value="all">All Courses</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredMaterials.map((material, index) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="group relative overflow-hidden rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-500/10">
                      <FileText className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {material.title}
                      </h3>
                      {material.course && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {material.course.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {material.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {material.description}
                    </p>
                  )}

                  <Separator className="mb-4" />

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>File</span>
                      <span className="font-mono">{material.file_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Size</span>
                      <span>{formatFileSize(material.file_size)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Uploaded</span>
                      <span>{new Date(material.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(material)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(material)}
                      className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(material.id, material.file_path)}
                      className="p-2 rounded-lg border border-border bg-background hover:bg-destructive/10 hover:border-destructive/50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-2">
            {searchQuery || selectedCourse !== 'all' ? 'No materials found' : 'No learning materials'}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            {searchQuery || selectedCourse !== 'all'
              ? 'Try adjusting your search or filter to find what you\'re looking for.'
              : 'Upload your first PDF learning material to get started.'}
          </p>
          {!searchQuery && selectedCourse === 'all' && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Upload PDF
            </button>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !uploading && setIsUploadModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-lg border border-border bg-card shadow-xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Upload Learning Material</h2>
                  <button
                    onClick={() => !uploading && setIsUploadModalOpen(false)}
                    disabled={uploading}
                    className="p-1 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {uploadError && (
                  <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {uploadError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Title <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      placeholder="Enter material title..."
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      disabled={uploading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      placeholder="Enter description (optional)..."
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
                      disabled={uploading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Course (Optional)</label>
                    <select
                      value={uploadForm.courseId}
                      onChange={(e) => setUploadForm({ ...uploadForm, courseId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      disabled={uploading}
                    >
                      <option value="">No course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      PDF File <span className="text-destructive">*</span>
                    </label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploading}
                      />
                      {uploadForm.file ? (
                        <div className="space-y-2">
                          <FileText className="h-8 w-8 text-primary mx-auto" />
                          <p className="text-sm font-medium">{uploadForm.file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(uploadForm.file.size)}</p>
                          <button
                            onClick={() => {
                              setUploadForm({ ...uploadForm, file: null });
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="text-xs text-destructive hover:underline"
                            disabled={uploading}
                          >
                            Remove file
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                          <div>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="text-sm font-medium text-primary hover:underline"
                              disabled={uploading}
                            >
                              Click to upload
                            </button>
                            <p className="text-xs text-muted-foreground mt-1">PDF files only (max 50MB)</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setIsUploadModalOpen(false)}
                    disabled={uploading}
                    className="flex-1 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !uploadForm.file || !uploadForm.title.trim()}
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {uploading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {viewingMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseViewer}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl h-[90vh] rounded-lg border border-border bg-card shadow-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold truncate">{viewingMaterial.title}</h2>
                  <p className="text-sm text-muted-foreground truncate">{viewingMaterial.file_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(viewingMaterial)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCloseViewer}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 overflow-hidden bg-muted/30">
                {loadingPdf ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading PDF...</p>
                    </div>
                  </div>
                ) : pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full border-0"
                    title={viewingMaterial.title}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Failed to load PDF</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

