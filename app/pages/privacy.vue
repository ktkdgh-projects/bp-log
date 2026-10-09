<script setup lang="ts">
definePageMeta({ layout: 'plain' })
useHead({ title: '개인정보처리방침 · bp-log' })
</script>

<template>
  <DocPage title="개인정보처리방침" updated="2026년 10월 9일">
    <h2>1. 모으는 정보</h2>
    <table>
      <thead><tr><th>구분</th><th>항목</th><th>목적</th></tr></thead>
      <tbody>
        <tr><td>계정</td><td>이메일, 닉네임, 비밀번호(복원할 수 없는 해시로만 저장)</td><td>가입·로그인, 내 기록 구분</td></tr>
        <tr><td>건강정보(민감정보)</td><td>혈압(수축기·이완기), 맥박, 측정 날짜·시간대, 메모와 태그</td><td>기록 보관, 달력·추이·동향 표시</td></tr>
        <tr><td>자동 수집</td><td>로그인 유지 쿠키, 접속 기기 종류, 접속 IP(요청 제한용, 최대 1시간)</td><td>로그인 유지, 부정 사용 방지</td></tr>
      </tbody>
    </table>

    <h2>2. 건강정보 별도 동의</h2>
    <p>혈압·맥박은 「개인정보 보호법」 제23조의 민감정보에 해당해 가입할 때 따로 동의를 받습니다. 동의하지 않으면 서비스를 이용할 수 없습니다.</p>

    <h2>3. 보관 기간</h2>
    <ul>
      <li>탈퇴하면 계정과 모든 기록을 즉시 삭제합니다.</li>
      <li>로그인 유지 정보는 최대 30일, 로그인 실패 기록은 최대 1시간 뒤 자동 삭제합니다.</li>
    </ul>

    <h2>4. 제3자 제공</h2>
    <p>이용자의 정보를 다른 곳에 제공하거나 판매하지 않습니다. 광고·분석 도구도 쓰지 않습니다.</p>

    <h2>5. 처리 위탁 (국외 이전)</h2>
    <table>
      <thead><tr><th>받는 곳</th><th>하는 일</th><th>위치</th></tr></thead>
      <tbody>
        <tr><td>Vercel Inc.</td><td>웹 서버 운영</td><td>미국 등 (네트워크 전송)</td></tr>
        <tr><td>MongoDB Inc. (Atlas)</td><td>데이터 저장</td><td>Atlas 클러스터 지역</td></tr>
      </tbody>
    </table>
    <p>정보는 이용 중 암호화된 통신(HTTPS)으로 전송되고 탈퇴 시 함께 삭제됩니다.</p>

    <h2>6. 이용자의 권리</h2>
    <p>설정에서 정보를 확인·수정할 수 있고, 회원 탈퇴로 언제든 삭제할 수 있습니다.</p>

    <h2>7. 안전 조치</h2>
    <ul>
      <li>비밀번호는 scrypt로 해시해 원문을 저장하지 않습니다.</li>
      <li>로그인 쿠키는 자바스크립트로 읽을 수 없게(httpOnly) 발급합니다.</li>
      <li>로그인을 5번 틀리면 10분 동안 잠급니다.</li>
    </ul>
  </DocPage>
</template>
