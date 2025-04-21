'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const router = useRouter();
  
  // Form states
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<string>('user');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Kullanıcı token'ını al ve yetkisini kontrol et
  useEffect(() => {
    const token = localStorage.getItem('token');
    setUserToken(token);
    
    if (!token) {
      router.push('/');
      return;
    }

    // Admin yetkisini kontrol et
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/check-admin', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          router.push('/');
        }
      } catch (err) {
        console.error('Yetki kontrolü hatası:', err);
        router.push('/');
      }
    };
    
    checkAdmin();
  }, [router]);

  // Kullanıcıları getir
  useEffect(() => {
    const fetchUsers = async () => {
      if (!userToken) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
          setError(null);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Kullanıcılar getirilirken bir hata oluştu');
        }
      } catch (err) {
        console.error('Kullanıcıları getirme hatası:', err);
        setError('Kullanıcılar getirilirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    
    if (userToken) {
      fetchUsers();
    }
  }, [userToken]);

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const userData = {
        name,
        email,
        password,
        role
      };

      let response;
      if (editingUser) {
        // Update existing user
        response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify(userData)
        });
      } else {
        // Create new user
        response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify(userData)
        });
      }

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(editingUser ? 'Kullanıcı başarıyla güncellendi!' : 'Kullanıcı başarıyla oluşturuldu!');
        resetForm();
        
        // Refresh user list
        const updatedResponse = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
        
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json();
          setUsers(updatedData);
        }
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Bir hata oluştu.');
      }
    } catch (err) {
      console.error('Form gönderimi hatası:', err);
      setErrorMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSaving(false);
    }
  };

  // Edit user handler
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // Password field is cleared when editing
    setRole(user.role);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete user handler
  const handleDelete = async (userId: string, index: number) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    setIsDeleting(index);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        setSuccessMessage('Kullanıcı başarıyla silindi!');
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Kullanıcı silinirken bir hata oluştu.');
      }
    } catch (err) {
      console.error('Kullanıcı silme hatası:', err);
      setErrorMessage('Kullanıcı silinirken bir hata oluştu.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Reset form
  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('user');
    setEditingUser(null);
  };

  // Styles
  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1.5rem',
  };

  const pageHeaderStyle = {
    marginBottom: '2rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '1rem',
  };

  const titleStyle = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '0.5rem',
  };

  const subtitleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '1rem',
    marginTop: '2rem',
  };

  const formContainerStyle = {
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  };

  const formGroupStyle = {
    marginBottom: '1rem',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    color: 'rgba(255, 255, 255, 0.7)',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '0.375rem',
    color: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.15s ease-in-out',
    fontSize: '0.875rem',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1.5rem',
  };

  const primaryButtonStyle = {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '0.375rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease-in-out',
    fontSize: '0.875rem',
  };

  const secondaryButtonStyle = {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '0.375rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease-in-out',
    fontSize: '0.875rem',
  };

  const tableContainerStyle: React.CSSProperties = {
    overflowX: 'auto',
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  };

  const tableHeaderStyle = {
    padding: '0.75rem 1rem',
    fontWeight: 'bold',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  const tableCellStyle = {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    fontSize: '0.875rem',
    verticalAlign: 'middle' as const,
  };

  const firstCellStyle = {
    ...tableCellStyle,
    fontWeight: 'bold',
  };

  const lastCellStyle = {
    ...tableCellStyle,
    textAlign: 'right' as const,
  };

  const actionButtonsStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  };

  const editButtonStyle = {
    padding: '0.25rem 0.75rem',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    color: '#3b82f6',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
  };

  const deleteButtonStyle = {
    padding: '0.25rem 0.75rem',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
  };

  const loadingMessageStyle = {
    textAlign: 'center' as const,
    padding: '2rem',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.875rem',
  };

  const messageStyle = {
    padding: '0.75rem 1rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  };

  const successMessageStyle = {
    ...messageStyle,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#10b981',
  };

  const errorMessageStyle = {
    ...messageStyle,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      {/* Admin Menü Bar */}
      <div className="admin-menu-bar">
        <div className="admin-menu-bar-inner">
          <div className="admin-menu-flex">
            <h2 className="admin-menu-title">Admin Panel</h2>
            <div className="admin-menu-links">
              <Link href="/admin" className="admin-menu-link">Dashboard</Link>
              <Link href="/admin/books" className="admin-menu-link">Kitaplar</Link>
              <Link href="/admin/users" className="admin-menu-link admin-menu-link-active">Kullanıcılar</Link>
              <Link href="/admin/borrows" className="admin-menu-link">Ödünç Alma</Link>
              <Link href="/admin/reports" className="admin-menu-link">Raporlar</Link>
            </div>
          </div>
        </div>
      </div>
      
      <div style={containerStyle}>
        <div style={pageHeaderStyle}>
          <h1 style={titleStyle}>Kullanıcı Yönetimi</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Kullanıcı ekleme, düzenleme ve silme işlemlerini gerçekleştirebilirsiniz.
          </p>
        </div>
        
        {/* Success and Error Messages */}
        {successMessage && (
          <div style={successMessageStyle}>
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div style={errorMessageStyle}>
            {errorMessage}
          </div>
        )}
        
        {/* Add/Edit User Form */}
        <div style={formContainerStyle}>
          <h2 style={subtitleStyle}>
            {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div style={formGroupStyle}>
                <label htmlFor="name" style={labelStyle}>
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  id="name"
                  style={inputStyle as React.CSSProperties}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div style={formGroupStyle}>
                <label htmlFor="email" style={labelStyle}>
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  id="email"
                  style={inputStyle as React.CSSProperties}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div style={formGroupStyle}>
                <label htmlFor="password" style={labelStyle}>
                  {editingUser ? 'Şifre (değiştirmek için doldurun)' : 'Şifre'}
                </label>
                <input
                  type="password"
                  id="password"
                  style={inputStyle as React.CSSProperties}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editingUser}
                />
              </div>
              
              <div style={formGroupStyle}>
                <label htmlFor="role" style={labelStyle}>
                  Kullanıcı Rolü
                </label>
                <select
                  id="role"
                  style={selectStyle as React.CSSProperties}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="user">Kullanıcı</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div style={buttonContainerStyle}>
              <button
                type="submit"
                style={{
                  ...primaryButtonStyle,
                  opacity: isSaving ? 0.7 : 1,
                }}
                disabled={isSaving}
              >
                {isSaving
                  ? 'Kaydediliyor...'
                  : editingUser
                    ? 'Kullanıcıyı Güncelle'
                    : 'Kullanıcı Ekle'
                }
              </button>
              
              {editingUser && (
                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={resetForm}
                >
                  İptal
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* User List */}
        <h2 style={subtitleStyle}>Kullanıcı Listesi</h2>
        
        {loading ? (
          <div style={loadingMessageStyle}>
            <p>Kullanıcılar yükleniyor...</p>
          </div>
        ) : error ? (
          <div style={errorMessageStyle}>
            <p>{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div style={loadingMessageStyle}>
            <p>Henüz kayıtlı kullanıcı bulunmuyor.</p>
          </div>
        ) : (
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Kullanıcı Adı</th>
                  <th style={tableHeaderStyle}>E-posta</th>
                  <th style={tableHeaderStyle}>Rol</th>
                  <th style={tableHeaderStyle}>Kayıt Tarihi</th>
                  <th style={tableHeaderStyle}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id} style={{ backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.1)' : 'transparent' }}>
                    <td style={firstCellStyle}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '50%', 
                          backgroundColor: 'rgba(59, 130, 246, 0.2)', 
                          color: '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '10px',
                          fontWeight: 'bold'
                        }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        {user.name}
                      </div>
                    </td>
                    <td style={tableCellStyle}>{user.email}</td>
                    <td style={tableCellStyle}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor: user.role === 'admin' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: user.role === 'admin' ? '#7c3aed' : '#3b82f6',
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td style={lastCellStyle}>
                      <div style={actionButtonsStyle}>
                        <button
                          style={editButtonStyle}
                          onClick={() => handleEdit(user)}
                        >
                          Düzenle
                        </button>
                        <button
                          style={{
                            ...deleteButtonStyle,
                            opacity: isDeleting === index ? 0.7 : 1,
                          }}
                          onClick={() => handleDelete(user.id, index)}
                          disabled={isDeleting === index}
                        >
                          {isDeleting === index ? 'Siliniyor...' : 'Sil'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 