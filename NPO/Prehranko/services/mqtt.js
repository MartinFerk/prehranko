import { connect } from 'mqtt';

export const publishActivityMQTT = (activityObject) => {
    const client = connect('wss://prehrankomosquitto-production.up.railway.app:8080', {
        clientId: 'rn_client_' + Math.random().toString(16).substr(2, 8),
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
    });

    client.on('connect', () => {
        console.log('🟢 MQTT povezava vzpostavljena');
        client.publish('/activity/new', JSON.stringify(activityObject), {}, (err) => {
            if (err) {
                console.error('❌ Napaka pri pošiljanju MQTT:', err.message);
            } else {
                console.log('📤 Aktivnost poslana preko MQTT');
            }
            client.end();
        });
    });

    client.on('error', (err) => {
        console.error('❌ Napaka pri povezavi MQTT:', err.message);
        client.end();
    });
};
