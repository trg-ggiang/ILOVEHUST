import { useState } from 'react';
import {
  GraduationCap, Bell, MessageSquare, BookOpen, CheckSquare,
  BarChart3, Calendar, MessageCircle, Search, Menu, X,
  TrendingUp, Award, Clock, Users, Plus, ChevronRight,
  Home, Settings, LogOut, Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function StudentDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const studentInfo = {
    name: 'Nguyen Van A',
    studentId: '20241234',
    avatar: null,
    class: 'IT-01',
    gpa: 3.75
  };

  // GPA data for chart
  const gpaData = [
    { semester: '学期1', gpa: 3.2, target: 3.5 },
    { semester: '学期2', gpa: 3.4, target: 3.5 },
    { semester: '学期3', gpa: 3.6, target: 3.5 },
    { semester: '学期4', gpa: 3.5, target: 3.5 },
    { semester: '学期5', gpa: 3.7, target: 3.5 },
    { semester: '学期6', gpa: 3.75, target: 3.5 },
  ];

  const recentGrades = [
    { subject: 'データ構造とアルゴリズム', grade: 8.5, credits: 4 },
    { subject: 'データベース管理', grade: 9.0, credits: 3 },
    { subject: 'ウェブ開発', grade: 8.0, credits: 3 },
  ];

  const todayTasks = [
    { id: 1, task: '数学の課題を提出', time: '14:00', completed: false },
    { id: 2, task: 'プロジェクトミーティング', time: '16:30', completed: false },
    { id: 3, task: '図書館で資料を借りる', time: '18:00', completed: true },
  ];

  const upcomingClasses = [
    { subject: 'ソフトウェアエンジニアリング', time: '08:00 - 10:00', room: 'D3-301' },
    { subject: '機械学習', time: '10:15 - 12:00', room: 'D5-205' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/20 to-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/30">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">I Love Hust</h1>
                  <p className="text-xs text-gray-500">学生ポータル</p>
                </div>
              </div>
            </div>

            {/* Center: Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="検索..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>
            </div>

            {/* Right: Notifications & Profile */}
            <div className="flex items-center gap-3">
              <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-900">{studentInfo.name}</p>
                  <p className="text-xs text-gray-500">{studentInfo.studentId}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                  {studentInfo.name.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 z-30 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } w-64`}>
          <div className="p-6 space-y-6 h-full flex flex-col">
            {/* Navigation Menu */}
            <nav className="space-y-2 flex-1">
              <MenuItem icon={Home} label="ホーム" active />
              <MenuItem icon={BookOpen} label="成績" />
              <MenuItem icon={MessageSquare} label="フォーラム" />
              <MenuItem icon={MessageCircle} label="メッセージ" />
              <MenuItem icon={CheckSquare} label="タスク" />
              <MenuItem icon={Calendar} label="スケジュール" />
              <MenuItem icon={BarChart3} label="統計" />
            </nav>

            {/* Bottom Menu */}
            <div className="space-y-2 pt-6 border-t border-gray-200">
              <MenuItem icon={Settings} label="設定" />
              <MenuItem icon={LogOut} label="ログアウト" />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                おかえりなさい、{studentInfo.name.split(' ').pop()}さん！
              </h2>
              <p className="text-gray-600">今日も頑張りましょう 🎓</p>
            </div>

            {/* Top Section: GPA Chart (Left) + Stats Cards (Right) */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* GPA Chart - Takes 1/2 of screen */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-red-600" />
                      GPA推移
                    </h3>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">現在のGPA</p>
                      <p className="text-4xl font-bold text-red-600">{studentInfo.gpa}</p>
                    </div>
                  </div>
                  <p className="text-gray-600">学期ごとのGPA変化</p>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={gpaData}>
                      <defs>
                        <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="semester"
                        stroke="#888888"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        domain={[0, 4.0]}
                        stroke="#888888"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '12px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#9ca3af"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                        name="目標"
                      />
                      <Area
                        type="monotone"
                        dataKey="gpa"
                        stroke="#dc2626"
                        strokeWidth={3}
                        fill="url(#colorGpa)"
                        name="GPA"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-red-50 rounded-xl">
                    <p className="text-xs text-gray-600 mb-1">最高GPA</p>
                    <p className="text-xl font-bold text-red-600">3.75</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs text-gray-600 mb-1">平均GPA</p>
                    <p className="text-xl font-bold text-blue-600">3.53</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-xl">
                    <p className="text-xs text-gray-600 mb-1">向上率</p>
                    <p className="text-xl font-bold text-green-600">+17%</p>
                  </div>
                </div>
              </div>

              {/* Stats Cards - Takes 1/2 of screen */}
              <div className="grid grid-cols-2 gap-4">
                <StatsCard
                  icon={BookOpen}
                  label="履修科目"
                  value="12"
                  trend="+2"
                  color="blue"
                />
                <StatsCard
                  icon={Award}
                  label="完了した課題"
                  value="28"
                  trend="+5"
                  color="green"
                />
                <StatsCard
                  icon={Users}
                  label="フォーラム投稿"
                  value="15"
                  trend="+3"
                  color="purple"
                />
                <StatsCard
                  icon={Target}
                  label="達成率"
                  value="87%"
                  trend="+12%"
                  color="orange"
                />
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - 2/3 width */}
              <div className="lg:col-span-2 space-y-6">
                {/* Today's Schedule */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-red-600" />
                      今日のスケジュール
                    </h3>
                    <button className="text-sm font-semibold text-red-600 hover:text-red-700">
                      すべて表示
                    </button>
                  </div>

                  <div className="space-y-3">
                    {upcomingClasses.map((cls, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-transparent rounded-xl border border-red-100 hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{cls.subject}</h4>
                          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4" />
                            {cls.time}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-3 py-1 bg-white rounded-lg text-sm font-medium text-gray-700 border border-gray-200">
                            {cls.room}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Grades */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-red-600" />
                      最近の成績
                    </h3>
                    <button className="text-sm font-semibold text-red-600 hover:text-red-700">
                      すべて表示
                    </button>
                  </div>

                  <div className="space-y-3">
                    {recentGrades.map((grade, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{grade.subject}</h4>
                          <p className="text-sm text-gray-500 mt-1">{grade.credits} 単位</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              grade.grade >= 8.5 ? 'text-green-600' :
                              grade.grade >= 7.0 ? 'text-blue-600' :
                              'text-orange-600'
                            }`}>
                              {grade.grade}
                            </div>
                          </div>
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            grade.grade >= 8.5 ? 'bg-green-100' :
                            grade.grade >= 7.0 ? 'bg-blue-100' :
                            'bg-orange-100'
                          }`}>
                            <Award className={`w-6 h-6 ${
                              grade.grade >= 8.5 ? 'text-green-600' :
                              grade.grade >= 7.0 ? 'text-blue-600' :
                              'text-orange-600'
                            }`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-4">クイックアクション</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <QuickActionButton icon={MessageSquare} label="質問する" />
                      <QuickActionButton icon={MessageCircle} label="チャット開始" />
                      <QuickActionButton icon={BookOpen} label="資料を見る" />
                      <QuickActionButton icon={Calendar} label="予定を追加" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - 1/3 width */}
              <div className="space-y-6">
                {/* Today's Tasks */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-red-600" />
                      今日のタスク
                    </h3>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Plus className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {todayTasks.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </div>

                  <button className="w-full mt-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-red-600 hover:text-red-600 transition-colors font-medium">
                    + 新しいタスク
                  </button>
                </div>

                {/* AI Chatbot Card */}
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                  <div className="absolute bottom-0 right-0 -mr-8 -mb-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">AIアシスタント</h3>
                    <p className="text-purple-100 text-sm mb-4">
                      質問がありますか？AIがお手伝いします
                    </p>
                    <button className="w-full bg-white text-purple-600 py-2.5 rounded-xl font-semibold hover:bg-purple-50 transition-colors flex items-center justify-center gap-2">
                      チャットを開始
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, active = false }: { icon: any; label: string; active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active
        ? 'bg-red-50 text-red-600 font-semibold'
        : 'text-gray-700 hover:bg-gray-50 font-medium'
    }`}>
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}

function StatsCard({ icon: Icon, label, value, trend, color }: any) {
  const colors = {
    red: 'from-red-500 to-red-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${colors[color as keyof typeof colors]} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
          {trend}
        </span>
      </div>
      <div>
        <p className="text-gray-600 text-sm mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function TaskItem({ task }: any) {
  const [completed, setCompleted] = useState(task.completed);

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
      completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-red-300'
    }`}>
      <button
        onClick={() => setCompleted(!completed)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
          completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-red-500'
        }`}
      >
        {completed && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1">
        <p className={`text-sm font-medium ${completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
          {task.task}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{task.time}</p>
      </div>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20 backdrop-blur-sm">
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
