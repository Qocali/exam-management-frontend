#!/bin/sh
# Konteyner açılarkən federation manifest-i environment dəyişənlərindən yaradır.
# Beləliklə eyni image müxtəlif mühitlərdə (test/prod) yenidən build olunmadan işləyir.
set -eu

MANIFEST=/usr/share/nginx/html/federation.manifest.json

cat > "$MANIFEST" <<EOF
{
  "mfe-lessons": "${MFE_LESSONS_URL%/}/remoteEntry.json",
  "mfe-students": "${MFE_STUDENTS_URL%/}/remoteEntry.json",
  "mfe-exams": "${MFE_EXAMS_URL%/}/remoteEntry.json",
  "mfe-tests": "${MFE_TESTS_URL%/}/remoteEntry.json"
}
EOF

echo "federation.manifest.json yaradıldı:"
cat "$MANIFEST"
