const router = require('express').Router();
const { logger } = require('../../../../lib/logger');
const auth = require('../../../../middleware/check-auth');
const readFile = require('../../../../lib/reads3File');

router.post('/allDistData' , auth.authController, async (req, res) => {
    try {
        logger.info('--- diksha tpd map allData api ---');
        var fileName = `diksha_tpd/map/state.json`;
        let jsonData = await readFile.readFileConfig(fileName);
        let fileMetaData = await readFile.getFileMetaData(fileName);
        var footer = jsonData['footer'];
        let mydata = jsonData;
        logger.info('--- diksha tpd map allData api response sent ---');
        res.send({ data: mydata, downloadData: jsonData, footer:footer, fileMetaData });
    } catch (e) {
        logger.error(`Error :: ${e}`)
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }
})




module.exports = router;