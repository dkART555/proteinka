const surveyForm = document.getElementById('surveyForm');
const successMessage = document.getElementById('successMessage');

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz13d8LrkE3mb9lJZQwakQKtAfRx-6AcbxzbaTvwhH8P8i9R5uleBrjm7--J5SUvhzvSA/exec';

if (surveyForm) {
    surveyForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(surveyForm);

        const selectedValues = Array.from(
            surveyForm.querySelectorAll('input[name="value"]:checked')
        );

        if (selectedValues.length > 2) {
            alert('Будь ласка, оберіть не більше 2 варіантів у пункті 7.');
            return;
        }

        const valueFactors = selectedValues
            .map(function(input) {
                return input.value;
            })
            .join(', ');

        const data = new URLSearchParams();

        data.append('type', 'survey');
        data.append('taste', formData.get('taste') || '');
        data.append('sweetness', formData.get('sweetness') || '');
        data.append('texture', formData.get('texture') || '');
        data.append('size', formData.get('size') || '');
        data.append('packaging', formData.get('packaging') || '');
        data.append('price', formData.get('price') || '');
        data.append('valueFactors', valueFactors);
        data.append('comment', formData.get('comment') || '');

        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: data
        });

        surveyForm.style.display = 'none';

        if (successMessage) {
            successMessage.style.display = 'block';
        }
    });
}