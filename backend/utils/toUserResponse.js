export default function toUserResponse(user) {
  const isStudent = user.role === 1;
  const profileCompleted = isStudent
    ? Boolean(user.studentProfile?.profileCompleted)
    : true;

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
    fullName: user.studentProfile?.fullName || "Admin",
    profileCompleted,
    studentCode: user.studentProfile?.studentCode || null,
    majorId: user.studentProfile?.majorId || null,
    major: user.studentProfile?.major?.majorName || null,
    schoolYear: user.studentProfile?.schoolYear || null,
    gpa: user.studentProfile?.gpa ? Number(user.studentProfile.gpa) : null,
    cpa: user.studentProfile?.cpa ? Number(user.studentProfile.cpa) : null,
    cttConnected: user.studentProfile?.cttConnected ?? false,
    bio: user.studentProfile?.bio || null,
  };
}
