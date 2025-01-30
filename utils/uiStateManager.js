const resourceRows = document.getElementById('resourceRows');
const musicSelect = document.getElementById('musicSelect');
const generateButton = document.getElementById('generateButton');

export function updateGenerateButtonState() {
  const hasResources = resourceRows.querySelectorAll('.resource-row').length > 0;
  const hasMusic = musicSelect.value !== '';
  
  // 各リソース行のバリデーション
  let allRowsValid = true;
  resourceRows.querySelectorAll('.resource-row').forEach(row => {
    const select = row.querySelector('.resource-select');
    const durationInput = row.querySelector('input[type="number"]');
    
    if (!select.value || !durationInput.value || parseFloat(durationInput.value) <= 0) {
      allRowsValid = false;
    }
  });

  generateButton.disabled = !(hasResources && hasMusic && allRowsValid);
  
  // デバッグ用ログ
  console.log('Button state update:');
  console.log('Resource rows:', resourceRows.querySelectorAll('.resource-row').length);
  console.log('Music selected:', musicSelect.value);
  console.log('All rows valid:', allRowsValid);
  console.log('Button disabled:', generateButton.disabled);
}
