import React, { useEffect, useState } from 'react'
import { Line, Circle } from 'rc-progress';
import { Button } from '@material-ui/core'
import Ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';


interface Props {
    fileInput: string
    fileName: string
    pathFolder: string
    startCreate: boolean
    outputFolder: string
    getTime: number
    removeTime: number
    deleteThis: () => void
    id: string,
    startProgress: () => void
    endProgress: () => void
}

enum ProgressStatus {
    TODO,
    PROGRESSING,
    PAUSE,
    DONE,
    KILLED,
    ERROR
}
export default function ProgressVideo({ id, startProgress, endProgress, fileInput, fileName, deleteThis, outputFolder, startCreate, pathFolder, removeTime, getTime }: Props) {
    const [progress, setProgress] = useState(0)
    const [progressStatus, setProgressStatus] = useState(ProgressStatus.TODO)

    const exRuning: FfmpegCommand = Ffmpeg()

    useEffect(() => {
        if ((startCreate) && (progressStatus === ProgressStatus.TODO)) {
            createVideo()
            setProgressStatus(ProgressStatus.PROGRESSING)
        }

    }, [startCreate])

    const createVideo = () => {
        startProgress()
        const folderSave = outputFolder;
        const pathFile = pathFolder + '/' + fileInput

        try {
            Ffmpeg.ffprobe(pathFile, function (err, metadata) {
                const { duration } = metadata.format
                if (duration) {
                    const numberPart = Math.ceil(duration / getTime)

                    const filters: any[] = []
                    for (let i = 0; i < numberPart; i++) {
                        const start = i * getTime
                        filters.push(`[0:v]trim=start=${start}:end=${(start + getTime) - removeTime},setpts=PTS-STARTPTS[v${i}]`)

                        filters.push(`[0:a]atrim=start=${start}:end=${(start + getTime) - removeTime},asetpts=PTS-STARTPTS[a${i}]`)
                        //    filters.push(`[0:a]atrim=${start}:duration=${getTime - removeTime},asetpts=PTS-STARTPTS[a${i}]`)

                    }
                    const strInputBuilder = []
                    for (let i = 0; i < numberPart; i++) {
                        strInputBuilder.push(`[v${i}][a${i}]`)
                    }


                    exRuning
                        .input(pathFile)
                        .complexFilter([
                            ...filters,
                            {
                                filter: "concat",
                                inputs: strInputBuilder.join(''),
                                options: {
                                    "n": numberPart,
                                    "v": 1,
                                    "a": 1,
                                },
                                outputs: "[video][audio]"
                            }
                        ])
                        .on('start', function (commandLine) {
                            console.log('Ffmpeg starting conversion with command: ' + commandLine)
                        })
                        .on('progress', function (progress) {


                            setProgress(progress.percent)

                        })
                        .on('end', function (stdout, stderr) {
                            setProgress(100)
                            setProgressStatus(ProgressStatus.DONE)
                            endProgress()
                            setTimeout(() => {
                                deleteThis()
                            }, 4000)

                        })
                        .on('error', function (err, stdout, stderr) {
                            console.log(err.message)
                            setProgressStatus(ProgressStatus.ERROR)
                            alert('Có lỗi rồi Hân ơi :)')
                        })
                        .outputOptions(["-map [video]", "-map [audio]"])
                        .output(`${folderSave}/${fileName}`)

                        .run()
                    //
                }
            })
        } catch (err) {
            console.log(err)

        }
    }


    return (
        <div className="progress" key={fileInput}>
            <div className="progress-info">
                <p className="progress-label">{`Split file ${fileInput} -> ${fileName} ${Math.round(progress)}%`}</p>
                <Line percent={progress} trailColor={(progressStatus !== ProgressStatus.ERROR) ? "#D3D3D3" : "red"} strokeColor="#00b795" />
            </div>
            <Button
                color={(progressStatus === ProgressStatus.TODO) ? "primary" : (progressStatus === ProgressStatus.PROGRESSING) ? "secondary" : "default"}
                variant="contained"
                onClick={() => {
                    switch (progressStatus) {
                        case ProgressStatus.TODO:
                            createVideo()
                            setProgressStatus(ProgressStatus.PROGRESSING)
                            break;
                        case ProgressStatus.PROGRESSING:
                            console.log("kill progress: " + id)
                            exRuning.kill('SIGINT')
                            setProgressStatus(ProgressStatus.KILLED)
                            endProgress()
                            setTimeout(() => {
                                deleteThis()
                            }, 3000)

                            break;
                    }
                }}>{(progressStatus === ProgressStatus.TODO) ? "Start" : (progressStatus === ProgressStatus.PROGRESSING) ? "Kill" : "Hidden"}</Button>
        </div>
    )
}