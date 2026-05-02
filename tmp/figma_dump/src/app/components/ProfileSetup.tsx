import { useState } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Book, GraduationCap, Upload, Camera, ChevronRight, CheckCircle2 } from 'lucide-react';

interface ProfileSetupProps {
  onComplete?: () => void;
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Personal Info
    fullName: '',
    studentId: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',

    // Academic Info
    faculty: '',
    major: '',
    course: '',
    class: '',
    enrollmentYear: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('提出されたフォームデータ:', formData);
    if (onComplete) {
      onComplete();
    }
  };

  const steps = [
    { number: 1, title: '基本情報', desc: '個人情報' },
    { number: 2, title: '学術情報', desc: '学習詳細' },
    { number: 3, title: '確認', desc: '情報確認' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/20 to-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">I Love Hust</h1>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">プロフィール設定</h2>
          <p className="text-gray-600 text-lg">アカウントを完成させるために情報を入力してください</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    currentStep > step.number
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : currentStep === step.number
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-110'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {currentStep > step.number ? <CheckCircle2 className="w-6 h-6" /> : step.number}
                  </div>
                  <div className="mt-3 text-center">
                    <p className={`text-sm font-semibold ${currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-4 rounded-full transition-all duration-500 ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                  }`} style={{ marginTop: '-45px' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="p-8 md:p-12">
                <div className="mb-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">基本情報</h3>
                  <p className="text-gray-600">個人情報を入力してください</p>
                </div>

                {/* Profile Picture Upload */}
                <div className="flex justify-center mb-10">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-16 h-16 text-gray-400" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-red-700 transition-all hover:scale-110 border-3 border-white">
                      <Camera className="w-5 h-5 text-white" />
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      氏名（フルネーム）<span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all bg-white hover:border-gray-300"
                        placeholder="Nguyen Van A"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      学籍番号<span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.studentId}
                        onChange={(e) => handleInputChange('studentId', e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all bg-white hover:border-gray-300"
                        placeholder="20241234"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      メールアドレス<span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all bg-white hover:border-gray-300"
                        placeholder="student@hust.edu.vn"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      電話番号<span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all bg-white hover:border-gray-300"
                        placeholder="0912345678"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      生年月日<span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all bg-white hover:border-gray-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      性別<span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all bg-white hover:border-gray-300"
                      required
                    >
                      <option value="">選択してください</option>
                      <option value="male">男性</option>
                      <option value="female">女性</option>
                      <option value="other">その他</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-2.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      住所
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                      <textarea
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all bg-white hover:border-gray-300 resize-none"
                        rows={3}
                        placeholder="ハノイ市..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Academic Information */}
            {currentStep === 2 && (
              <div className="p-8 md:p-12">
                <div className="mb-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">学術情報</h3>
                  <p className="text-gray-600">学習に関する情報を入力してください</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      学部<span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.faculty}
                      onChange={(e) => handleInputChange('faculty', e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all bg-white hover:border-gray-300"
                      required
                    >
                      <option value="">選択してください</option>
                      <option value="electrical">電気電子工学部</option>
                      <option value="mechanical">機械工学部</option>
                      <option value="civil">土木工学部</option>
                      <option value="chemical">化学工学部</option>
                      <option value="it">情報技術学部</option>
                      <option value="management">経営管理学部</option>
                    </select>
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      専攻<span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Book className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.major}
                        onChange={(e) => handleInputChange('major', e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all bg-white hover:border-gray-300"
                        placeholder="コンピュータサイエンス"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      コース<span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.course}
                      onChange={(e) => handleInputChange('course', e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all bg-white hover:border-gray-300"
                      required
                    >
                      <option value="">選択してください</option>
                      <option value="undergraduate">学部課程</option>
                      <option value="graduate">大学院課程</option>
                      <option value="doctorate">博士課程</option>
                    </select>
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      クラス<span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.class}
                      onChange={(e) => handleInputChange('class', e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all bg-white hover:border-gray-300"
                      placeholder="IT-01"
                      required
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      入学年度<span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.enrollmentYear}
                      onChange={(e) => handleInputChange('enrollmentYear', e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all bg-white hover:border-gray-300"
                      required
                    >
                      <option value="">選択してください</option>
                      <option value="2026">2026年</option>
                      <option value="2025">2025年</option>
                      <option value="2024">2024年</option>
                      <option value="2023">2023年</option>
                      <option value="2022">2022年</option>
                      <option value="2021">2021年</option>
                    </select>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-red-50 rounded-2xl border border-red-100">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Book className="w-5 h-5 text-red-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">情報の正確性を確認してください</h4>
                      <p className="text-sm text-gray-600">
                        学術情報は後で変更することができますが、正確な情報を提供することで、より良いサービスを受けることができます。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <div className="p-8 md:p-12">
                <div className="mb-10 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">情報確認</h3>
                  <p className="text-gray-600">入力された情報を確認してください</p>
                </div>

                <div className="space-y-6">
                  {/* Profile Image */}
                  {profileImage && (
                    <div className="flex justify-center">
                      <img src={profileImage} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl" />
                    </div>
                  )}

                  {/* Personal Information */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-red-600" />
                      基本情報
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <InfoRow label="氏名" value={formData.fullName} />
                      <InfoRow label="学籍番号" value={formData.studentId} />
                      <InfoRow label="メール" value={formData.email} />
                      <InfoRow label="電話" value={formData.phone} />
                      <InfoRow label="生年月日" value={formData.dateOfBirth} />
                      <InfoRow label="性別" value={formData.gender === 'male' ? '男性' : formData.gender === 'female' ? '女性' : 'その他'} />
                      {formData.address && <InfoRow label="住所" value={formData.address} className="md:col-span-2" />}
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-red-600" />
                      学術情報
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <InfoRow label="学部" value={formData.faculty} />
                      <InfoRow label="専攻" value={formData.major} />
                      <InfoRow label="コース" value={formData.course} />
                      <InfoRow label="クラス" value={formData.class} />
                      <InfoRow label="入学年度" value={formData.enrollmentYear} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="px-8 md:px-12 pb-8 md:pb-12 flex gap-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
                >
                  戻る
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="flex-1 group flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-2xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/40 font-semibold"
                >
                  次へ
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 group flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-2xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40 font-semibold"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  完了
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Help text */}
        <p className="text-center text-sm text-gray-500 mt-8">
          問題がありますか？ <a href="#" className="text-red-600 hover:text-red-700 font-semibold hover:underline">サポートに連絡</a>
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value || '—'}</p>
    </div>
  );
}
