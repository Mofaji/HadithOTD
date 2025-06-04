const API_KEY = '$2y$10$QWLHjBSyZQoJ85j5tAj1CuRy9Qz8KSR0JcJE6pgbpfmwuF5eEDrVa';
const BOOKS = [
    'sahih-bukhari',
    'sahih-muslim',
    'al-tirmidhi',
    'abu-dawood',
    'ibn-e-majah',
    'sunan-nasai',
    'mishkat',
    'musnad-ahmad',
    'al-silsila-sahiha'
];

async function getRandomBackground() {
    try {
        const response = await fetch('https://api.unsplash.com/photos/random?query=nature,landscape,mountains&client_id=oZQma7v_znVRCBBdlJt5jwPwuyt2O4DfYHL350hq_rA');
        const data = await response.json();
        return data.urls.regular;
    } catch (error) {
        console.error('Error fetching background:', error);
        return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb';
    }
}

// NOTE: sahih_bukhari.json is now the main hadith data file. Make sure it is in the same directory as your HTML file when deploying.
async function getRandomHadith() {
    try {
        const response = await fetch('sahih_bukhari.json');
        const data = await response.json();
        // Support both {volumes: [...]} and [...] top-level array
        const volumes = Array.isArray(data) ? data : data.volumes;
        if (!volumes) throw new Error('No volumes found in data');
        // Get all hadiths from all volumes and books
        const allHadiths = [];
        volumes.forEach(volume => {
            volume.books.forEach(book => {
                book.hadiths.forEach(hadith => {
                    allHadiths.push({
                        ...hadith,
                        bookName: book.name,
                        volumeName: volume.name
                    });
                });
            });
        });
        if (allHadiths.length === 0) {
            throw new Error('No hadiths available');
        }
        // Get a random hadith
        const randomHadith = allHadiths[Math.floor(Math.random() * allHadiths.length)];
        // Format the hadith data
        // Format info: 'Sahih-Al-Bukhari' (hardcoded), then book name, then Volume/Book/Number, then narrator
        let infoStr = `${randomHadith.volumeName}, ${randomHadith.bookName} - ${randomHadith.info}`;
        let formattedInfo = 'Sahih-Al-Bukhari';
        // Extract book name and the rest
        const firstCommaIdx = infoStr.indexOf(',');
        let afterVolume = infoStr;
        if (firstCommaIdx !== -1) {
            afterVolume = infoStr.slice(firstCommaIdx + 1).trim();
        }
        // Split at the first ' - ' to separate book name and the rest
        const dashIdx = afterVolume.indexOf(' - ');
        if (dashIdx !== -1) {
            const bookName = afterVolume.slice(0, dashIdx).trim();
            const rest = afterVolume.slice(dashIdx + 3).trim();
            // Find the first colon for the Volume/Book/Number part
            const colonIdx = rest.indexOf(':');
            if (colonIdx !== -1) {
                const volBookNum = rest.slice(0, colonIdx + 1).trim();
                const narrator = rest.slice(colonIdx + 1).trim();
                formattedInfo += `\n\n${bookName}\n${volBookNum}`;
                if (narrator) formattedInfo += `\n${narrator}`;
            } else {
                // If no colon, just put the rest on the next line
                formattedInfo += `\n\n${bookName}\n${rest}`;
            }
        } else {
            // If no dash, just put the rest on the next line
            formattedInfo += `\n\n${afterVolume}`;
        }
        const hadithData = {
            arabic: randomHadith.arabic || '',
            translation: randomHadith.text || '',
            transcription: '',
            info: formattedInfo,
            grade: randomHadith.by ? `${randomHadith.by} (R.A)` : ''
        };
        console.log('Selected hadith:', hadithData);
        return hadithData;
    } catch (error) {
        console.error('Error fetching hadith:', error);
        return {
            arabic: 'Error loading hadith',
            translation: 'Please try again',
            transcription: '',
            info: 'Error',
            grade: 'Error loading grade'
        };
    }
}

async function updateHadith() {
    // Show loading state
    document.getElementById('arabic').textContent = 'Loading...';
    document.getElementById('translation').textContent = 'Loading...';
    document.getElementById('transcription').textContent = 'Loading...';
    document.getElementById('info').textContent = 'Loading...';
    document.getElementById('grade').textContent = 'Loading...';

    try {
        const [background, hadith] = await Promise.all([
            getRandomBackground(),
            getRandomHadith()
        ]);

        document.body.style.background = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${background}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        
        document.getElementById('arabic').textContent = hadith.arabic;
        document.getElementById('transcription').textContent = hadith.transcription;
        document.getElementById('translation').textContent = hadith.translation;
        document.getElementById('info').textContent = hadith.info;
        document.getElementById('grade').textContent = hadith.grade;
    } catch (error) {
        console.error('Error updating content:', error);
    }
}

async function downloadImage() {
    const buttonContainer = document.querySelector('.button-container');
    buttonContainer.style.display = 'none';

    try {
        // Ensure Arabic font is loaded
        await document.fonts.load('16px "Amiri"');

        const element = document.body;
        const canvas = await html2canvas(element, {
            scale: 2,
            logging: true,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            width: window.innerWidth,
            height: window.innerHeight,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            onclone: function(clonedDoc) {
                const arabicText = clonedDoc.querySelector('.arabic');
                if (arabicText) {
                    arabicText.style.fontFamily = 'Amiri, serif';
                    arabicText.style.direction = 'rtl';
                }
            }
        });

        buttonContainer.style.display = 'flex';

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `hadith-${timestamp}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }, 'image/png', 1.0);
    } catch (error) {
        console.error('Error generating image:', error);
        buttonContainer.style.display = 'flex';
    }
}

// Add event listeners
document.getElementById('refresh').addEventListener('click', updateHadith);
document.getElementById('downloadBtn').addEventListener('click', downloadImage);

// Initialize the page
updateHadith();