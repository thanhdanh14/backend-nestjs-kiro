'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, message, Upload, Modal, Image, Typography, Tag } from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import axiosInstance from '@/lib/axios';
import { UploadedFile } from '@/types';
import dayjs from 'dayjs';
import Cookies from 'js-cookie';

const { Title } = Typography;

export default function FilesPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/upload/my-files');
      // Backend trả về { total, files }
      const filesData = response.data.files || [];
      
      // Map id -> _id để match với type
      const mappedFiles = filesData.map((file: any) => ({
        _id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        mimetype: file.mimetype,
        size: file.size,
        path: file.url,
        uploadedBy: '',
        createdAt: file.uploadedAt,
      }));
      
      setFiles(mappedFiles);
    } catch (error: any) {
      message.error('Không thể tải danh sách files!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axiosInstance.post('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      onSuccess(response.data);
      message.success(`${file.name} upload thành công!`);
      fetchFiles();
    } catch (error: any) {
      onError(error);
      message.error(`${file.name} upload thất bại!`);
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    customRequest: handleUpload,
    showUploadList: false,
    multiple: false,
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/upload/${id}`);
      message.success('Xóa file thành công!');
      fetchFiles();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Xóa file thất bại!');
    }
  };

  const handlePreview = (file: UploadedFile) => {
    setPreviewFile(file);
    setPreviewVisible(true);
  };

  const handleDownload = async (file: UploadedFile) => {
    try {
      // Sử dụng URL trực tiếp từ backend
      const url = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/upload/view/${file.filename}`;
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Tải file thành công!');
    } catch (error: any) {
      message.error('Tải file thất bại!');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isImage = (mimetype: string) => {
    return mimetype.startsWith('image/');
  };

  const columns = [
    {
      title: 'Tên File',
      dataIndex: 'originalName',
      key: 'originalName',
      ellipsis: true,
    },
    {
      title: 'Loại',
      dataIndex: 'mimetype',
      key: 'mimetype',
      render: (mimetype: string) => {
        const type = mimetype.split('/')[0];
        const colors: any = {
          image: 'blue',
          video: 'purple',
          audio: 'green',
          application: 'orange',
        };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: 'Kích Thước',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => formatFileSize(size),
    },
    {
      title: 'Ngày Upload',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Thao Tác',
      key: 'action',
      render: (_: any, record: UploadedFile) => (
        <Space>
          {isImage(record.mimetype) && (
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            >
              Xem
            </Button>
          )}
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          >
            Tải
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={3} className="!mb-0">Quản Lý Files</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchFiles}>
            Làm mới
          </Button>
          <Upload {...uploadProps}>
            <Button type="primary" icon={<UploadOutlined />}>
              Upload File
            </Button>
          </Upload>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={files}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        open={previewVisible}
        title={previewFile?.originalName}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        {previewFile && isImage(previewFile.mimetype) && (
          <Image
            src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/upload/view/${previewFile.filename}`}
            alt={previewFile.originalName}
            className="w-full"
          />
        )}
      </Modal>
    </div>
  );
}
