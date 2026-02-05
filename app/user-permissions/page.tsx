'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Upload, 
  Eye, 
  Pencil, 
  Trash2,
  Crown,
  User,
  Briefcase,
  Check,
  X,
  History,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';

// Mock data types
type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';

type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  lastAccess: string;
};

type RoleInfo = {
  role: UserRole;
  title: string;
  description: string;
  userCount: number;
  color: string;
  icon: React.ReactNode;
};

type Permission = {
  name: string;
  admin: boolean;
  manager: boolean;
  staff: boolean;
};

const roleInfo: RoleInfo[] = [
  {
    role: 'ADMIN',
    title: 'ผู้ดูแลระดับสูงสุด',
    description: 'มีสิทธิ์เข้าถึงและจัดการทุกส่วนของระบบ รวมถึงการกำหนดสิทธิ์ผู้ใช้คนอื่น',
    userCount: 0,
    color: 'pink',
    icon: <Crown className="w-6 h-6" />,
  },
  {
    role: 'MANAGER',
    title: 'ผู้จัดการ',
    description: 'สามารถจัดการข้อมูลและรายงาน อนุมัติคำขอต่างๆ และดูแลทีมงาน',
    userCount: 0,
    color: 'blue',
    icon: <Briefcase className="w-6 h-6" />,
  },
  {
    role: 'STAFF',
    title: 'พนักงาน',
    description: 'สามารถเข้าถึงข้อมูลพื้นฐานและใช้งานระบบในส่วนที่เกี่ยวข้องกับงาน',
    userCount: 0,
    color: 'green',
    icon: <User className="w-6 h-6" />,
  },
];

const permissions: Permission[] = [
  { name: 'จัดการผู้ใช้งาน', admin: true, manager: false, staff: false },
  { name: 'ดูรายงาน', admin: true, manager: true, staff: false },
  { name: 'จัดการคลังสินค้า', admin: true, manager: true, staff: false },
  { name: 'อนุมัติออร์เดอร์', admin: true, manager: true, staff: false },
  { name: 'จัดการสินค้า', admin: true, manager: true, staff: true },
  { name: 'จัดการสต็อกสินค้า', admin: true, manager: true, staff: true },
  { name: 'เพิ่ม-ลบประเภทสินค้า', admin: true, manager: true, staff: true },
  { name: 'แก้ไขข้อมูลหมวดหมู่', admin: true, manager: true, staff: true },
];

export default function UserPermissionsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ role: string; id?: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleStats, setRoleStats] = useState<Record<string, number>>({
    admin: 0,
    manager: 0,
    staff: 0,
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'STAFF',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const itemsPerPage = 5;

  // Check user role and permissions
  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      
      if (data.ok && data.user) {
        const userRole = data.user.StaffRole?.toLowerCase();
        
        // Block staff from accessing this page
        if (userRole === 'staff') {
          window.location.href = '/';
          return;
        }
        
        setCurrentUser({ 
          role: userRole,
          id: data.user.StaffID 
        });
        // Only fetch users if user is admin or manager
        if (userRole === 'admin' || userRole === 'manager') {
          fetchUsers();
        }
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      window.location.href = '/login';
    }
  };

  // Fetch users from API
  const fetchUsers = async () => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (selectedRole !== 'all') {
        params.append('role', selectedRole.toLowerCase());
      }

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setUsers(data.items || []);
        if (data.roleStats) {
          setRoleStats(data.roleStats);
        }
      } else {
        if (data.error?.includes('Forbidden')) {
          window.location.href = '/';
          return;
        }
        alert(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager')) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedRole, currentUser]);

  // Filter users (client-side filtering for pagination)
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCreateUser = () => {
    setFormData({ name: '', email: '', role: 'STAFF', password: '' });
    setIsCreateModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
    });
    setIsEditModalOpen(true);
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!formData.name || !formData.email || !formData.role || !formData.password) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        await fetchUsers();
        setIsCreateModalOpen(false);
        setFormData({ name: '', email: '', role: 'STAFF', password: '' });
        alert('สร้างผู้ใช้งานสำเร็จ');
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedUser || !formData.name || !formData.email) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // Don't allow role change if editing own account
    const isOwnAccount = currentUser?.id === selectedUser.id;
    if (!isOwnAccount && !formData.role) {
      alert('กรุณาเลือกบทบาท');
      return;
    }

    try {
      setSubmitting(true);
      const updateData: any = {
        id: selectedUser.id,
        name: formData.name,
        email: formData.email,
        status: selectedUser.status,
      };

      // Only include role if not editing own account
      if (!isOwnAccount) {
        updateData.role = formData.role;
      }

      // Only include password if provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (data.ok) {
        await fetchUsers();
        setIsEditModalOpen(false);
        setSelectedUser(null);
        setFormData({ name: '', email: '', role: 'STAFF', password: '' });
        alert('อัปเดตข้อมูลผู้ใช้งานสำเร็จ');
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตผู้ใช้งาน');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/users?id=${selectedUser.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.ok) {
        await fetchUsers();
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
        alert('ลบผู้ใช้งานสำเร็จ');
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error || 'ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('เกิดข้อผิดพลาดในการลบผู้ใช้งาน');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportData = () => {
    // Placeholder for export functionality
    console.log('Export data');
  };

  const handleViewHistory = () => {
    // Placeholder for view history functionality
    console.log('View access history');
  };

  const getRoleIcon = (role: UserRole) => {
    const info = roleInfo.find((r) => r.role === role);
    return info?.icon || <User className="w-5 h-5" />;
  };

  const getRoleColor = (role: UserRole) => {
    const info = roleInfo.find((r) => r.role === role);
    return info?.color || 'gray';
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'STAFF':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Show loading or access denied while checking permissions
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
        </div>
      </div>
    );
  }

  // Block staff access (should be redirected, but show message just in case)
  if (currentUser.role === 'staff') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">ไม่ได้รับอนุญาต</h1>
          <p className="text-gray-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">จัดการสิทธิ์การเข้าใช้งานระบบ</h1>
              <p className="text-xs text-gray-600 mt-1">กำหนดและควบคุมสิทธิ์การเข้าถึงข้อมูลของผู้ใช้งาน</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {roleInfo.map((role) => {
            const count = roleStats[role.role.toLowerCase()] || 0;
            return (
              <Card key={role.role}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">{role.role}</p>
                      <p className="text-lg font-bold text-gray-900">{count}</p>
                      <p className="text-[0.65rem] text-gray-500 mt-1">จำนวนผู้ใช้งาน</p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      role.color === 'pink'
                        ? 'bg-pink-100'
                        : role.color === 'blue'
                        ? 'bg-blue-100'
                        : 'bg-green-100'
                    }`}>
                      <div className={
                        role.color === 'pink'
                          ? 'text-pink-600'
                          : role.color === 'blue'
                          ? 'text-blue-600'
                          : 'text-green-600'
                      }>
                        {role.icon}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* User List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">รายชื่อผู้ใช้งาน</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="ค้นหารายชื่อ"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
                <Select value={selectedRole} onValueChange={(value) => {
                  setSelectedRole(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="h-9 w-[140px] text-xs">
                    <SelectValue placeholder="ทุกบทบาท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกบทบาท</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="MANAGER">MANAGER</SelectItem>
                    <SelectItem value="STAFF">STAFF</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-9 px-3 text-xs" onClick={handleExportData}>
                  <Upload className="w-4 h-4 mr-2" />
                  ส่งออกข้อมูล
                </Button>
                {currentUser?.role === 'admin' && (
                  <Button
                    className="bg-pink-600 hover:bg-pink-700 text-white h-9 px-3 text-xs"
                    onClick={handleCreateUser}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    สร้างผู้ใช้งานใหม่
                  </Button>
                )}
              </div>
              {/* Table */}
              {loading ? (
                <div className="text-center py-8 text-gray-500 text-xs">กำลังโหลด...</div>
              ) : paginatedUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">ไม่พบข้อมูลผู้ใช้งาน</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <THead>
                        <TR>
                          <TH className="w-[200px] text-xs">ผู้ใช้งาน</TH>
                          <TH className="w-[120px] text-xs">บทบาท</TH>
                          <TH className="w-[140px] text-xs">สถานะ</TH>
                          <TH className="w-[180px] text-xs">วันที่เข้าใช้งานล่าสุด</TH>
                          <TH className="w-[200px] text-xs">การดำเนินการ</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {paginatedUsers.map((user) => (
                          <TR key={user.id}>
                            <TD>
                              <div className="text-xs">
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-gray-500 text-[0.7rem]">{user.email}</div>
                              </div>
                            </TD>
                            <TD>
                              <span className="text-xs font-medium">{user.role}</span>
                            </TD>
                            <TD>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-medium ${
                                  user.status === 'active'
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                }`}
                              >
                                {user.status === 'active' ? 'เปิดใช้งาน' : 'พักการใช้งาน'}
                              </span>
                            </TD>
                            <TD className="text-xs text-gray-600">{user.lastAccess}</TD>
                            <TD>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-[0.7rem] px-2"
                                  onClick={() => handleViewDetails(user)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  ดูรายละเอียด
                                </Button>
                                {currentUser?.role === 'admin' && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-7 w-7 p-0"
                                      onClick={() => handleEditUser(user)}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteUser(user)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {filteredUsers.length > 0 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-xs text-gray-600">
                        แสดง {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)} ถึง{' '}
                        {Math.min(currentPage * itemsPerPage, filteredUsers.length)} จาก{' '}
                        {filteredUsers.length} รายการ
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className={`h-8 w-8 p-0 text-xs ${currentPage === pageNum ? 'bg-pink-500 hover:bg-pink-600' : ''}`}
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="สร้างผู้ใช้งานใหม่"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-semibold">ชื่อ-นามสกุล</Label>
            <Input 
              id="name" 
              placeholder="กรอกชื่อ-นามสกุล" 
              className="text-sm h-9"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-semibold">อีเมล</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="กรอกอีเมล" 
              className="text-sm h-9"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="role" className="text-sm font-semibold">บทบาท</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
              <SelectTrigger className="text-sm h-9">
                <SelectValue placeholder="เลือกบทบาท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="MANAGER">MANAGER</SelectItem>
                <SelectItem value="STAFF">STAFF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="password" className="text-sm font-semibold">รหัสผ่าน</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="กรอกรหัสผ่าน" 
              className="text-sm h-9"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateModalOpen(false);
                setFormData({ name: '', email: '', role: 'STAFF', password: '' });
              }} 
              className="text-sm"
              disabled={submitting}
            >
              ยกเลิก
            </Button>
            <Button 
              className="bg-pink-500 hover:bg-pink-600 text-sm"
              onClick={handleCreateSubmit}
              disabled={submitting}
            >
              {submitting ? 'กำลังสร้าง...' : 'สร้างผู้ใช้งาน'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="แก้ไขข้อมูลผู้ใช้งาน"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-sm font-semibold">ชื่อ-นามสกุล</Label>
              <Input 
                id="edit-name" 
                className="text-sm h-9"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-email" className="text-sm font-semibold">อีเมล</Label>
              <Input 
                id="edit-email" 
                type="email" 
                className="text-sm h-9"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-role" className="text-sm font-semibold">บทบาท</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                disabled={currentUser?.id === selectedUser.id}
              >
                <SelectTrigger className="text-sm h-9" disabled={currentUser?.id === selectedUser.id}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="MANAGER">MANAGER</SelectItem>
                  <SelectItem value="STAFF">STAFF</SelectItem>
                </SelectContent>
              </Select>
              {currentUser?.id === selectedUser.id && (
                <p className="text-xs text-gray-500 mt-1">ไม่สามารถแก้ไขบทบาทของตัวเองได้</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-status" className="text-sm font-semibold">สถานะ</Label>
              <Select 
                value={selectedUser.status} 
                onValueChange={(value) => {
                  if (selectedUser) {
                    setSelectedUser({ ...selectedUser, status: value as 'active' | 'inactive' });
                  }
                }}
              >
                <SelectTrigger className="text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">เปิดใช้งาน</SelectItem>
                  <SelectItem value="inactive">พักการใช้งาน</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-password" className="text-sm font-semibold">รหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</Label>
              <Input 
                id="edit-password" 
                type="password" 
                placeholder="กรอกรหัสผ่านใหม่" 
                className="text-sm h-9"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedUser(null);
                  setFormData({ name: '', email: '', role: 'STAFF', password: '' });
                }} 
                className="text-sm"
                disabled={submitting}
              >
                ยกเลิก
              </Button>
              <Button 
                className="bg-pink-500 hover:bg-pink-600 text-sm"
                onClick={handleEditSubmit}
                disabled={submitting}
              >
                {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="รายละเอียดผู้ใช้งาน"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">ชื่อ-นามสกุล</p>
              <p className="text-sm text-gray-600">{selectedUser.name}</p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">อีเมล</p>
              <p className="text-sm text-gray-600">{selectedUser.email}</p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">บทบาท</p>
              <p className="text-sm text-gray-600">{selectedUser.role}</p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">สถานะ</p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-medium ${
                  selectedUser.status === 'active'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}
              >
                {selectedUser.status === 'active' ? 'เปิดใช้งาน' : 'พักการใช้งาน'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">วันที่เข้าใช้งานล่าสุด</p>
              <p className="text-sm text-gray-600">{selectedUser.lastAccess}</p>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)} className="text-sm">
                ปิด
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="ยืนยันการลบผู้ใช้งาน"
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน{' '}
              <span className="font-bold">{selectedUser.name}</span>?
            </p>
            <p className="text-xs text-red-600">
              การกระทำนี้ไม่สามารถยกเลิกได้
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedUser(null);
                }} 
                className="text-sm"
                disabled={submitting}
              >
                ยกเลิก
              </Button>
              <Button 
                className="bg-red-500 hover:bg-red-600 text-sm"
                onClick={handleDeleteConfirm}
                disabled={submitting}
              >
                {submitting ? 'กำลังลบ...' : 'ลบผู้ใช้งาน'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
