import { Observable } from 'rxjs/Observable'
import 'rxjs/add/observable/from'
import 'rxjs/add/observable/range'
import 'rxjs/add/observable/zip'
import 'rxjs/add/operator/toPromise'
import 'rxjs/add/operator/toArray'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/groupby'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/reduce'
import 'rxjs/add/operator/max'
import 'rxjs/add/operator/min'
import 'rxjs/add/operator/first'
import 'rxjs/add/operator/share'

export class OHLCModel {
    constructor(date, open, high, low, close, volume) {
        this.date = date
        this.open = open
        this.high = high
        this.low = low
        this.close = close
        this.volume = volume
    }
}

export function aggregate(indexFunc, originalOHLC) {
    const originalDateObservable = Observable.from(originalOHLC.date)
    const dateWithIndex = Observable.zip(originalDateObservable, Observable.range(0, originalOHLC.date.length))
    const groupedKeyDate = dateWithIndex.groupBy((item) => indexFunc(item[0]).getTime()).share()

    const open = groupedKeyDate.flatMap(group => group.reduce((acc, curr) => acc[0] < curr[0] ? acc : curr))
        .map(item => originalOHLC.open[item[1]])
        .toArray()

    const close = groupedKeyDate.flatMap(group => group.reduce((acc, curr) => acc[0] > curr[0] ? acc : curr))
        .map(item => originalOHLC.close[item[1]])
        .toArray()

    const high = groupedKeyDate.flatMap(group => group.map(item => originalOHLC.high[item[1]]).max())
        .toArray()

    const low = groupedKeyDate.flatMap(group => group.map(item => originalOHLC.low[item[1]]).min())
        .toArray()

    const volume = groupedKeyDate.flatMap(group => group.map(item => originalOHLC.volume[item[1]]).reduce((s, v) => s + v, 0))
        .toArray()

    const keyTime = groupedKeyDate.flatMap(group => group.first().map(item => indexFunc(item[0])))
        .toArray()

    return Observable.zip(keyTime, open, high, low, close, volume).map(item => {
        return new OHLCModel(
            item[0],
            item[1],
            item[2],
            item[3],
            item[4],
            item[5]
        )
    }).toPromise()
}

export function toWeek(date) {
    return new Date(date.getTime() - ((date.getDay() - 1) * 86400000))
}

export function toMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function toYear(date) {
    return new Date(date.getFullYear(), 0, 1)
}

