fetch('data.json').then(resp =>
    resp.json().then((data) => {
        const DataModel = muze.DataModel;

        data = data
            .filter(row => !!row[1]) /* Delets rows which does not contain any data */
            .map(row => (row[2] = JSON.stringify(row[2]), row));

        const nData = [
            ['Airline', 'Date', 'Details']
        ];
        data.forEach(row => nData.push(row));

        console.log(nData);

        const schema = [{
            name: 'Airline',
            type: 'dimension'
        }, {
            name: 'Date',
            type: 'dimension',
            subtype: 'temporal',
            format: '%b-%e-%Y'
        }, {
            name: 'Details',
            type: 'dimension'
        }];

        const dm = new DataModel(nData, schema);
        let sdm = dm.sort([['Date']])

        // Create a variable to create pseudo axis
        sdm = sdm.calculateVariable({
            name: 'pseudo-axis',
            type: 'measure',
            defAggFn: 'first'
        }, ['Date', () => 1]);

        muze().canvas()
            .data(sdm)
            .height(100)
            .width(600)
            .rows(['pseudo-axis'])
            .columns(['Date'])
            .color('Airline')
            .layers([{ mark: 'point' }])
            .mount('#timeline-viz')
    })
);


/**
 * Plan
 * ------------
 * 
 * Q: How many incidents/accidents are recorded so far?
 * Q: Contribution of each airline on total incidents?
 * Q: year by year accidents with airline?
 */