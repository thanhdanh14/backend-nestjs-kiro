'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Input, Button, Card, message, Typography, Space } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import axiosInstance from '@/lib/axios';
import { setTokens } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Text } = Typography;

function VerifyOTPContent() {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const { setUser } = useAuth();

  useEffect(() => {
    if (!email) {
      message.error('Email không hợp lệ!');
      router.push('/login');
    }
  }, [email, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/auth/verify-otp', {
        email,
        otp: values.otp,
      });

      const { access_token, refresh_token } = response.data;
      
      // Lưu tokens
      setTokens(access_token, refresh_token);
      
      // Load user profile sau khi có token
      const profileResponse = await axiosInstance.get('/auth/profile');
      setUser(profileResponse.data);
      
      message.success('Xác thực OTP thành công!');
      router.push('/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Xác thực OTP thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      await axiosInstance.post('/auth/resend-otp', { email });
      message.success('Đã gửi lại mã OTP!');
      setCountdown(60);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gửi lại OTP thất bại!');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <SafetyOutlined className="text-3xl text-blue-600" />
          </div>
          <Title level={2} className="!mb-2">Xác Thực OTP</Title>
          <Text type="secondary">
            Mã OTP đã được gửi đến email:<br />
            <strong>{email}</strong>
          </Text>
        </div>

        <Form
          name="verify-otp"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="otp"
            rules={[
              { required: true, message: 'Vui lòng nhập mã OTP!' },
              { len: 6, message: 'Mã OTP phải có 6 ký tự!' }
            ]}
          >
            <Input 
              placeholder="Nhập mã OTP 6 số" 
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              className="h-12"
            >
              Xác Thực
            </Button>
          </Form.Item>

          <div className="text-center">
            <Space direction="vertical" size="small">
              <Text type="secondary">Không nhận được mã?</Text>
              <Button
                type="link"
                onClick={handleResendOTP}
                loading={resendLoading}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOTPContent />
    </Suspense>
  );
}
