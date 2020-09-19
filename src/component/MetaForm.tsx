import React, { Component, useState, useEffect } from 'react'
import { FormControl, InputLabel, Input, TextField, makeStyles, Button } from '@material-ui/core'
import { AttachFile, HourglassEmpty } from '@material-ui/icons';
import { BrowserWindow } from 'electron';
import Ffmpeg from 'fluent-ffmpeg';
import ProgressVideo from './ProgressVideo'
import uuid from 'short-uuid'
import storage from 'electron-json-storage'



const electron = require('electron').remote
const dialog = electron.dialog


interface Props {
    appSetting: AppSetting
}

interface AppSetting {
    getTime: number
    removeTime: number
    maxProgress: number
}

interface ProgressSplit {
    id: string
    fileInput: string
    fileName: string
}

enum ProgressStatus {
    PENDDING,
    DONE,
    PROGRESS
}

export default function MetaForm({ appSetting }: Props) {
    const [getTime, setGetTime] = useState(appSetting.getTime.toString())
    const [removeTime, setRemoveTime] = useState(appSetting.removeTime.toString())
    const [maxProgressString, setMaxProgressString] = useState(appSetting.maxProgress.toString())
    const [maxProgress, setMaxProgress] = useState(appSetting.maxProgress)

    const [numberProgress, setNumberProgress] = useState(0)
    const [numberProgressEnd, setNumberProgressEnd] = useState(0)
    const [numberVideos, setNumberVideos] = useState(0)

    const [pathFolder, setPathFolder] = useState<string>('')
    const [outputFolder, setOutputFolder] = useState<string>('')
    const [progressSplits, setProgressSplits] = useState<ProgressSplit[]>([])
    const [startCreate, setStartCreate] = useState(false)

    const [disableInput, setDisableInput] = useState(false)


    useEffect(() => {
        const fs = require('fs');
        try {
            if (fs.existsSync(pathFolder)) {
                fs.readdir(pathFolder, (err: any, files: string[]) => {
                    files = files.filter(file => ((file.indexOf('.mp4') > -1) || (file.indexOf('.mkv') > -1) || (file.indexOf('.avi') > -1)))

                    const progressSplits: ProgressSplit[] = files.map(((file: string) => {
                        if (file.indexOf('.') === 0)
                            file = file.slice(1)

                        if (file.lastIndexOf('.icloud') != -1)
                            file = file.slice(0, file.lastIndexOf('.icloud'))

                        return {
                            id: uuid().generate(),
                            fileInput: file,
                            fileName: file.slice(0, file.indexOf('.')) + '_result.mp4'
                        }
                    }))

                    setNumberVideos(progressSplits.length)

                    setProgressSplits(progressSplits)
                });
            }
        } catch (err) {
            console.error(err)
        }

    }, [pathFolder])

    useEffect(() => {
        if (numberProgressEnd >= numberVideos) {
            setDisableInput(false)
            setStartCreate(false)

            setPathFolder("")
            setOutputFolder("")
            setProgressSplits([])
            setNumberProgress(0)
            setNumberProgressEnd(0)
            setNumberVideos(0)
        }
    }, [numberProgressEnd])

    return (
        <div className="container">

            <form className="form-input" noValidate autoComplete="off">
                <div className="number-input-inline">
                    <TextField type="number" label="Lấy (giây)"
                        value={getTime}
                        InputProps={{
                            className: "number-field"
                        }}
                        onChange={(event) => {
                            setGetTime(event.target.value)
                            if (event.target.value) {
                                storage.set("appSetting", {
                                    ...appSetting,
                                    getTime: Number.parseInt(event.target.value)
                                }, (err) => {
                                    console.log(err)
                                })
                            }

                        }}
                        disabled={disableInput}
                    />
                    <TextField type="number" label="Bỏ (giây)"
                        value={removeTime}
                        InputProps={{
                            className: "number-field"
                        }}
                        disabled={disableInput}
                        onChange={(event) => {
                            setRemoveTime(event.target.value)
                            if (Number.parseInt(event.target.value)) {
                                storage.set("appSetting", {
                                    ...appSetting,
                                    removeTime: Number.parseInt(event.target.value)
                                }, (err) => {
                                    console.log(err)
                                })
                            }
                        }
                        }

                    />
                    <TextField type="number" label="Tiến trình tối đa"
                        value={maxProgressString}
                        InputProps={{
                            className: "number-field"
                        }}
                        disabled={disableInput}

                        onChange={(event) => {
                            if (Number.parseInt(event.target.value)) {
                                setMaxProgress(Number.parseInt(event.target.value))
                                storage.set("appSetting", {
                                    ...appSetting,
                                    maxProgress: Number.parseInt(event.target.value)
                                }, (err) => {
                                    console.log(err)
                                })

                            }
                            else setMaxProgress(5)
                            setMaxProgressString(event.target.value)
                        }}
                    />
                </div>
                <div className="input-inline">
                    <TextField type="string" label="Input folder"
                        value={pathFolder}
                        InputProps={{
                            className: "text-field"
                        }}
                        disabled={disableInput}
                        onChange={(event) => setPathFolder(event.target.value)}
                    />
                    <Button
                        color="primary"
                        variant="contained"
                        className="directory-button"
                        size="small"
                        disabled={disableInput}
                        onClick={() => {
                            const openDirectory = dialog.showOpenDialog({ properties: ['openDirectory'] })
                            if ((openDirectory) && (openDirectory.length > 0))
                                setPathFolder(openDirectory[0])
                        }}
                    >Input folder</Button>
                </div>
                <div className="input-inline">
                    <TextField type="string" label="Output folder"
                        value={outputFolder}
                        InputProps={{
                            className: "text-field"
                        }}
                        disabled={disableInput}
                        onChange={(event) => setOutputFolder(event.target.value)}
                    />
                    <Button
                        color="primary"
                        size="small"
                        variant="contained"
                        className="directory-button"
                        disabled={disableInput}
                        onClick={() => {
                            const folderSelect = dialog.showOpenDialog({ properties: ['openDirectory'] })
                            if ((folderSelect) && (folderSelect.length > 0)) {
                                const folderSave = folderSelect[0]
                                setOutputFolder(folderSave)

                            }
                        }}
                    >Output folder</Button>
                </div>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                        console.log("OKI")
                        setStartCreate(true)
                    }}>Create videos</Button>
            </form >

            <div className="prgress-content">
                {progressSplits.map((progressSplit, index) => (
                    <ProgressVideo
                        endProgress={() => {
                            setNumberProgress((numberProgress) => numberProgress - 1)
                            setNumberProgressEnd((numberProgressEnd) => numberProgressEnd + 1)
                        }}

                        id={progressSplit.id}
                        startProgress={() => {
                            setNumberProgress((numberProgress) => numberProgress + 1)
                            setDisableInput(true)

                        }}
                        key={progressSplit.id}
                        fileInput={progressSplit.fileInput}
                        deleteThis={() => {
                            setProgressSplits((progressSplits) => progressSplits.filter(ps => ps.id !== progressSplit.id))
                        }}

                        fileName={progressSplit.fileName}

                        startCreate={(startCreate) && ((index - numberProgressEnd) < maxProgress)}
                        pathFolder={pathFolder}
                        outputFolder={outputFolder}
                        getTime={Number.parseInt(getTime) ? Number.parseInt(getTime) : 0}
                        removeTime={Number.parseInt(removeTime) ? Number.parseInt(removeTime) : 0}
                    />
                ))}
            </div>
        </div>
    )
}