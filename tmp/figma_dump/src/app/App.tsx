import { useState } from 'react';
import { GraduationCap, Mail, Lock, ChevronRight, Sparkles, Shield, Users } from 'lucide-react';
import ProfileSetup from './components/ProfileSetup';
import StudentDashboard from './components/StudentDashboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'profile' | 'dashboard'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('ログイン情報:', email, password);
    setCurrentPage('profile');
  };

  const handleProfileComplete = () => {
    setCurrentPage('dashboard');
  };

  if (currentPage === 'dashboard') {
    return <StudentDashboard />;
  }

  if (currentPage === 'profile') {
    return <ProfileSetup onComplete={handleProfileComplete} />;
  }

  return (
    <div className="size-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50 bg-[url('https://images.unsplash.com/photo-1700671562333-f71286a7c748?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzc3Mjk1NzE1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/50 via-red-800/40 to-red-900/50 backdrop-blur-[3px]"></div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative w-full max-w-6xl flex items-stretch bg-white/98 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_80px_rgba(0,0,0,0.3)] overflow-hidden m-6 border border-white/20 min-h-[650px]">
        {/* Left column - Branding */}
        <div className="hidden md:flex flex-col justify-between w-5/12 bg-gradient-to-br from-red-600 via-red-700 to-red-900 p-12 text-white relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white opacity-[0.07] blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-red-950 opacity-30 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-white/10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-white/5"></div>

          {/* Content */}
          <div className="relative z-10 space-y-6">
            <div className="group">
              <div className="w-20 h-20 bg-white/15 rounded-[1.25rem] flex items-center justify-center mb-8 backdrop-blur-md border border-white/20 shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:bg-white/20">
                <GraduationCap className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight tracking-tight">
                I Love Hust
                <span className="block text-3xl font-normal text-red-100 mt-2">へようこそ</span>
              </h1>
              <div className="w-16 h-1 bg-white/40 rounded-full"></div>
              <p className="text-red-50/90 text-lg leading-relaxed max-w-sm">
                ハノイ工科大学の学生専用の総合的な学習・オリエンテーションプラットフォーム。
              </p>
            </div>

            {/* Feature highlights */}
            <div className="pt-6 space-y-3">
              {[
                { icon: Sparkles, text: 'スマートな学習管理' },
                { icon: Shield, text: '安全でセキュア' },
                { icon: Users, text: 'コミュニティサポート' }
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 text-red-100/80 group/item hover:text-white transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover/item:bg-white/20 transition-colors">
                    <feature.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom section */}
          <div className="relative z-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-3 border-red-700 bg-gradient-to-br from-red-300 to-red-400 shadow-lg"></div>
                  <div className="w-10 h-10 rounded-full border-3 border-red-700 bg-gradient-to-br from-red-400 to-red-500 shadow-lg"></div>
                  <div className="w-10 h-10 rounded-full border-3 border-red-700 bg-gradient-to-br from-red-500 to-red-600 shadow-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-white">5K+</span>
                  </div>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">5,000人以上の学生</p>
                  <p className="text-red-200/80 text-xs">が既に利用しています</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Login Form */}
        <div className="w-full md:w-7/12 p-10 md:p-12 lg:p-16 flex flex-col justify-center bg-gradient-to-br from-white to-gray-50/50">
          <div className="max-w-md w-full mx-auto">
            {/* Mobile header */}
            <div className="md:hidden flex items-center gap-4 mb-10 pb-8 border-b border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">I Love Hust</h1>
                <p className="text-sm text-gray-500">学生ポータル</p>
              </div>
            </div>

            {/* Header */}
            <div className="mb-10">
              <div className="inline-block px-4 py-2 bg-red-50 rounded-full mb-4">
                <span className="text-sm font-medium text-red-600">ようこそお帰りなさい</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">ログイン</h2>
              <p className="text-gray-500 text-base">アカウントにアクセスするには詳細を入力してください</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email field */}
              <div className="space-y-2.5">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  メールアドレスまたは学籍番号
                </label>
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${focusedField === 'email' ? 'text-red-600' : 'text-gray-400'}`}>
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all duration-200 bg-white hover:border-gray-300 hover:shadow-sm text-base"
                    placeholder="student@hust.edu.vn"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2.5">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  パスワード
                </label>
                <div className="relative group">
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${focusedField === 'password' ? 'text-red-600' : 'text-gray-400'}`}>
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all duration-200 bg-white hover:border-gray-300 hover:shadow-sm text-base"
                    placeholder="••••••••••"
                    required
                  />
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-focus:ring-3 peer-focus:ring-red-500/20 peer-checked:bg-red-600 peer-checked:border-red-600 transition-all duration-200 flex items-center justify-center group-hover:border-red-500 group-hover:shadow-sm">
                      {rememberMe && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-600 group-hover:text-gray-900 transition">ログイン状態を保存</span>
                </label>
                <a href="#" className="text-sm font-semibold text-red-600 hover:text-red-700 hover:underline transition-all underline-offset-2">
                  パスワードを忘れた場合
                </a>
              </div>

              {/* Login button */}
              <button
                type="submit"
                className="group relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-2xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/40 font-semibold text-base mt-8 active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative">ログイン</span>
                <ChevronRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            {/* Sign up link */}
            <div className="mt-10 pt-8 border-t border-gray-100">
              <p className="text-center text-sm text-gray-600">
                アカウントをお持ちでないですか？{' '}
                <a href="#" className="font-semibold text-red-600 hover:text-red-700 hover:underline transition-all underline-offset-2">
                  新しいアカウントを作成
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
