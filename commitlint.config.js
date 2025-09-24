module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'build',
        'ci',
        'revert',
        'config',
      ],
    ],
    'type-case': [0, 'never'], // type이 반드시 소문자일 필요 없음
    'header-max-length': [0, 'always', 100], // 길이 체크 끔
    'subject-case': [0, 'never'], // 소문자 강제 비활성화
  },
};
