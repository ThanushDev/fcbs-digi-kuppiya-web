import { useState } from 'react'
import {
  Shield,
  Camera,
  UserCheck,
  Lock,
  Trash2,
  FileText,
  Mail,
  GraduationCap,
  Database,
  Cloud,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  User,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

const sections = [
  {
    id: 'collection',
    title: 'Information We Collect',
    icon: Database,
    description: 'We collect only the minimum data necessary to provide our academic services.',
    items: [
      { icon: Mail, label: 'Email Address', desc: 'Used for authentication, account recovery, and important notifications.' },
      { icon: GraduationCap, label: 'Academic Information', desc: 'Batch/Year, Specialization selection, and Course Grades/GPA entries.' },
      { icon: Camera, label: 'Face Verification Photo', desc: 'A single facial image captured during setup for identity verification.' },
      { icon: User, label: 'Profile Data', desc: 'Name and department (BMS/LCS) as provided during registration.' },
    ]
  },
  {
    id: 'face-verification',
    title: 'Face Verification \u2014 Purpose & Limitations',
    icon: UserCheck,
    isCritical: true,
    description: 'Your biometric facial image is handled with the highest level of protection.',
    criticalPoints: [
      {
        icon: CheckCircle,
        color: 'text-emerald-600 bg-emerald-50',
        title: 'Strictly for Identity Verification',
        desc: 'The face photo is used ONLY to confirm you are the legitimate account holder during login and sensitive actions (exam results access, profile changes). This prevents impersonation and unauthorized access.'
      },
      {
        icon: CheckCircle,
        color: 'text-emerald-600 bg-emerald-50',
        title: 'Anti-Impersonation Security',
        desc: 'Ensures that only you can access your academic records, GPA data, and personal dashboard.'
      },
      {
        icon: XCircle,
        color: 'text-red-600 bg-red-50',
        title: 'NOT Used for AI Training',
        desc: 'Your facial image is NEVER used to train, improve, or contribute to any third-party AI/ML models, facial recognition databases, or commercial profiling systems.'
      },
      {
        icon: XCircle,
        color: 'text-red-600 bg-red-50',
        title: 'NOT Used for Surveillance',
        desc: 'We do not monitor, track, or analyze your facial data beyond the single verification check at authentication.'
      },
      {
        icon: XCircle,
        color: 'text-red-600 bg-red-50',
        title: 'NOT Shared with Third Parties',
        desc: 'Your biometric data never leaves our secured Firebase infrastructure and is never sold, licensed, or shared.'
      }
    ]
  },
  {
    id: 'academic-purpose',
    title: 'Purpose of Academic Data Processing',
    icon: FileText,
    description: 'Your academic data serves only your educational journey.',
    items: [
      'Personal GPA/CGPA calculation across semesters.',
      'Specialization eligibility tracking (Year I\u2013II OGPA for specialization selection).',
      'Batch-level anonymized profiling for departmental analytics (no individual identification).',
      'Cloud synchronization so your grades persist across devices.',
      'Generating personalized semester breakdowns and progress reports.'
    ]
  },
  {
    id: 'no-sharing',
    title: 'No Third-Party Sharing or Sale',
    icon: Shield,
    isBinding: true,
    description: 'We make a binding commitment to your privacy.',
    commitments: [
      'We DO NOT sell your personal data to any third party.',
      'We DO NOT lease, rent, or trade your data.',
      'We DO NOT share your data with advertisers, data brokers, or commercial entities.',
      'We DO NOT use your data for targeted advertising.',
      'We DO NOT disclose your data to unauthorized persons or entities.',
      'Academic staff may only view aggregated, anonymized batch statistics \u2014 never individual records without consent.'
    ]
  },
  {
    id: 'security',
    title: 'Data Security & Cloud Storage',
    icon: Lock,
    description: 'Industry-standard protection powered by Google Firebase.',
    measures: [
      { icon: Cloud, title: 'Encrypted Cloud Storage', desc: 'All data (grades, photos, profiles) stored in Firebase Firestore and Firebase Storage with encryption at rest (AES-256) and in transit (TLS 1.2+).' },
      { icon: Settings, title: 'Access Controls', desc: 'Firestore Security Rules enforce that users can only read/write their own data. Admin access is role-gated and audited.' },
      { icon: Eye, title: 'Biometric Isolation', desc: 'Face verification photos stored in a dedicated Firebase Storage bucket with strict path-based access rules (user-scoped only).' },
      { icon: Database, title: 'Automatic Backups', desc: 'Firebase managed backups with point-in-time recovery for disaster resilience.' },
      { icon: AlertCircle, title: 'Incident Response', desc: 'We follow Firebase/Google Cloud security incident protocols. Affected users notified per PDPA requirements.' }
    ]
  },
  {
    id: 'user-rights',
    title: 'Your Rights & Complete Data Erasure',
    icon: Trash2,
    isCritical: true,
    description: 'Under Sri Lanka PDPA, you have full control over your data.',
    rights: [
      { icon: CheckCircle, color: 'text-emerald-600', title: 'Right to Access', desc: 'Request a copy of all data we hold about you at any time.' },
      { icon: CheckCircle, color: 'text-emerald-600', title: 'Right to Rectification', desc: 'Correct inaccurate or incomplete data via your profile settings.' },
      { icon: CheckCircle, color: 'text-emerald-600', title: 'Right to Data Portability', desc: 'Export your grades and profile data in machine-readable format.' },
      { icon: CheckCircle, color: 'text-emerald-600', title: 'Right to Restrict Processing', desc: 'Limit how we process your data where applicable.' },
      {
        icon: Trash2,
        color: 'text-red-600',
        title: 'Right to Erasure (Complete Deletion)',
        desc: 'Deleting your account triggers IMMEDIATE and PERMANENT removal of: (1) Face verification photo from Firebase Storage, (2) All GPA/grade records from Firestore, (3) Profile document from Firestore, (4) Firebase Auth account. Zero data is retained \u2014 no archives, no backups of your personal records, no soft-deletes. This action is irreversible.'
      },
      { icon: CheckCircle, color: 'text-emerald-600', title: 'Right to Withdraw Consent', desc: 'Withdraw consent for optional processing (e.g., analytics) without affecting core service.' }
    ]
  },
  {
    id: 'compliance',
    title: 'Sri Lanka PDPA Compliance Statement',
    icon: FileText,
    isBinding: true,
    description: 'Official acknowledgment of legal adherence.',
    compliance: [
      'This application is designed to comply with the Sri Lanka Personal Data Protection Act, No. 9 of 2022 (PDPA).',
      'We act as the Data Controller for student personal data processed through this platform.',
      'Firebase (Google LLC) acts as our Data Processor under a Data Processing Agreement with Standard Contractual Clauses.',
      'Lawful basis for processing: (a) Contract performance (providing GPA calculator service), (b) Legitimate interest (account security via face verification), (c) Explicit consent (for optional features).',
      'Data Protection Impact Assessment (DPIA) conducted for biometric face verification processing.',
      'Data retention: Active account data retained while account exists. All personal data purged within 30 days of account deletion request (immediate for biometric data).',
      'Cross-border transfer: Firebase servers may reside outside Sri Lanka. Transfers rely on Google\'s adequacy commitments and SCCs per PDPA Section 31.',
      'Data Protection Officer contact: dpo@fcbs.lk (or your institutional DPO).',
      'Last updated: October 2026. Version 1.0.'
    ]
  }
]

export default function PrivacyPolicy() {
  const [expanded, setExpanded] = useState(new Set(['collection', 'face-verification']))

  const toggleSection = (id) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isOpen = (id) => expanded.has(id)

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
          Your privacy is our priority. This policy explains what data we collect, why we collect it, how we protect it, and your rights under the Sri Lanka Personal Data Protection Act (PDPA).
        </p>
        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-gray-400">
          <span className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" /> PDPA Compliant
          </span>
          <span className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
            <Lock className="w-3.5 h-3.5" /> Firebase Secured
          </span>
          <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full">
            <UserCheck className="w-3.5 h-3.5" /> Biometric Protected
          </span>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.id} className="card overflow-hidden border-gray-200 transition-all duration-300">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors text-left"
              aria-expanded={isOpen(section.id)}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                section.isCritical ? 'bg-red-50 text-red-600' :
                section.isBinding ? 'bg-indigo-50 text-indigo-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                <section.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                  {section.isCritical && (
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 rounded">CRITICAL</span>
                  )}
                  {section.isBinding && (
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-indigo-100 text-indigo-700 rounded">BINDING</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{section.description}</p>
              </div>
              <div className="flex-shrink-0">
                {isOpen(section.id) ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 mt-1" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 mt-1" />
                )}
              </div>
            </button>

            <div className={`${isOpen(section.id) ? 'animate-slide-down' : 'hidden'} px-6 pb-6 pt-2`}>
              <div className="border-t border-gray-100 pt-4 space-y-4">

                {section.items && (
                  <dl className="space-y-4">
                    {section.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3">
                        {typeof item === 'string' ? (
                          <>
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                              <dd className="text-sm text-gray-600">{item}</dd>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                              <item.icon className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <dt className="font-medium text-gray-900">{item.label}</dt>
                              <dd className="text-sm text-gray-500 mt-0.5">{item.desc}</dd>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </dl>
                )}

                {section.criticalPoints && (
                  <div className="space-y-3">
                    {section.criticalPoints.map((point, idx) => (
                      <div key={idx} className="flex gap-3 p-3 rounded-xl border">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${point.color}`}>
                          <point.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{point.title}</h3>
                          <p className="text-sm text-gray-600 mt-0.5">{point.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {section.measures && (
                  <div className="space-y-4">
                    {section.measures.map((measure, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                          <measure.icon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{measure.title}</h3>
                          <p className="text-sm text-gray-600 mt-0.5">{measure.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {section.rights && (
                  <div className="space-y-3">
                    {section.rights.map((right, idx) => (
                      <div key={idx} className="flex gap-3 p-3 rounded-xl bg-gray-50 border">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${right.color} bg-opacity-10`}>
                          <right.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{right.title}</h3>
                          <p className="text-sm text-gray-600 mt-0.5">{right.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {section.commitments && (
                  <div className="space-y-2">
                    {section.commitments.map((commitment, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                        <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{commitment}</span>
                      </div>
                    ))}
                  </div>
                )}

                {section.compliance && (
                  <div className="space-y-3">
                    {section.compliance.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Questions or Concerns?</h3>
            <p className="text-sm text-gray-600 mt-1">
              For any privacy concerns, data deletion requests, or questions regarding your personal data, you can contact our Platform Administration Team directly through the in-app support channel or email us at <a href="mailto:fcbsdigikuppiya@gmail.com" className="text-indigo-600 hover:underline font-medium">fcbsdigikuppiya@gmail.com</a>. You may also lodge a complaint with the Sri Lanka Data Protection Authority if you believe your privacy rights have been violated.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}