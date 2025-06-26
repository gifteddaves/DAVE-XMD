/*  

  Made By Dave
  Base : Dave
  WhatsApp : wa.me/254104260236
  Telegram : t.me/Digladoo
  Youtube : @davlodavlo19

  Channel : https://whatsapp.com/channel/0029VbApvFQ2Jl84lhONkc3k

  Copy Code?, Recode?, Rename?, Reupload?, Reseller? Taruh Credit Ya :D

  Deskripsi: Fungsi Untuk Mengambil Hasil Download Dengan Format Mp3
  Mohon Untuk Tidak Menghapus Watermark Di Dalam Kode Ini

*/

const axios = require('axios');

async function DavexMdMp3(url) {
    let title, image;

    const getDownloadId = async () => {
        try {
            const response = await axios.get('https://ab.cococococ.com/ajax/download.php', {
                params: {
                    copyright: 0,
                    format: 'mp3',
                    url: url,
                    api: 'dfcb6d76f2f6a9894gjkege8a4ab232222'
                }
            });
            return response.data;
        } catch (error) {
            throw new Error('⚠️ Failed to get download ID');
        }
    };

    const checkProgress = async (id) => {
        try {
            const response = await axios.get('https://p.oceansaver.in/ajax/progress.php', {
                params: { id: id }
            });
            return response.data;
        } catch (error) {
            throw new Error('⚠️ Failed to check download progress');
        }
    };

    const pollProgress = async (id) => {
        const data = await checkProgress(id);
        if (data.progress === 1000) {
            return {
                type: 'mp3 (128 kbps)',
                title: title,
                image: image,
                download_url: data.download_url
            };
        } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return pollProgress(id);
        }
    };

    try {
        const data = await getDownloadId();
        if (data.success && data.id) {
            title = data.info.title;
            image = data.info.image;
            return await pollProgress(data.id);
        } else {
            throw new Error('⚠️ Failed to fetch audio metadata');
        }
    } catch (error) {
        return { error: error.message };
    }
}

module.exports = DavexMdMp3;
