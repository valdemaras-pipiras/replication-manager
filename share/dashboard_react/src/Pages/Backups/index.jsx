import { createColumnHelper } from '@tanstack/react-table'
import React, { useEffect, useMemo, useState } from 'react'
import { convertObjectToArray, formatBytes, formatDate, getBackupMethod, getBackupStrategy } from '../../utility/common'
import AccordionComponent from '../../components/AccordionComponent'
import { DataTable } from '../../components/DataTable'
import styles from './styles.module.scss'
import { Box, HStack, VStack } from '@chakra-ui/react'
import TableType3 from '../../components/TableType3'
import { useDispatch, useSelector } from 'react-redux'
import { getBackupSnapshot } from '../../redux/clusterSlice'

function Backups({ selectedCluster }) {
  const dispatch = useDispatch()
  const [data, setData] = useState([])
  const [snapshotData, setSnapshotData] = useState([])
  const columnHelper = createColumnHelper()

  const {
    cluster: { backupSnapshots }
  } = useSelector((state) => state)

  useEffect(() => {
    dispatch(getBackupSnapshot({ clusterName: selectedCluster?.name }))
  }, [])

  useEffect(() => {
    if (selectedCluster?.backupList) {
      setData(convertObjectToArray(selectedCluster.backupList))
    }
  }, [selectedCluster?.backupList])
  useEffect(() => {
    if (backupSnapshots?.length > 0) {
      setSnapshotData(backupSnapshots)
    }
  }, [backupSnapshots])
  console.log('snapshotData::', snapshotData)

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.id, {
        cell: (info) => info.getValue(),
        header: 'ID',
        id: 'id'
      }),
      columnHelper.accessor(
        (row) => (
          <>
            {formatDate(row.startTime)} <br />
            {formatDate(row.endTime)}
          </>
        ),
        {
          cell: (info) => info.getValue(),
          header: 'Start - End Time',
          id: 'startendTime',
          minWidth: 160
        }
      ),
      columnHelper.accessor(
        (row) => (
          <VStack className={styles.cellStack}>
            <Box className={styles.cellValue}>{getBackupMethod(row.backupMethod)}</Box>
            <Box className={styles.cellValue}>{row.backupTool}</Box>
          </VStack>
        ),
        {
          cell: (info) => info.getValue(),
          header: 'Backup Method / Tool',
          id: 'backupMethod'
        }
      ),
      columnHelper.accessor((row) => getBackupStrategy(row.backupStrategy), {
        cell: (info) => info.getValue(),
        header: 'Strategy',
        id: 'strategy'
      }),
      columnHelper.accessor(
        (row) => (
          <VStack className={styles.cellStack}>
            <Box className={styles.cellValue}>{row.source}</Box>
            <Box className={styles.cellValue}>{row.dest}</Box>
          </VStack>
        ),
        {
          cell: (info) => info.getValue(),
          header: 'Source - Dest',
          id: 'srcDest'
        }
      ),
      columnHelper.accessor((row) => formatBytes(row.size), {
        cell: (info) => info.getValue(),
        header: 'Backup Size',
        id: 'backupSize',
        minWidth: 100
      }),
      columnHelper.accessor((row) => (row.compressed ? 'Yes' : 'No'), {
        cell: (info) => info.getValue(),
        header: 'Compressed',
        id: 'compression'
      }),
      columnHelper.accessor(
        (row) => (
          <VStack>
            <div>{row.encrypted ? 'Yes' : 'No'}</div>
            {row.encrypted && (
              <VStack className={styles.cellStack}>
                <Box className={styles.cellValue}>{row.encryptionAlgo}</Box>
                <Box className={styles.cellValue}>{row.encryptionKey}</Box>
              </VStack>
            )}
          </VStack>
        ),
        {
          cell: (info) => info.getValue(),
          header: 'Encryption Details',
          id: 'encryption'
        }
      ),
      columnHelper.accessor(
        (row) => (
          <VStack className={styles.cellStack}>
            <Box className={styles.cellValue}>{`File: ${row.binLogFileName}`}</Box>
            <Box className={styles.cellValue}>{`Pos: ${row.binLogFilePos}`}</Box>
            <Box className={styles.cellValue}>{`GTID: ${row.binLogUuid}`}</Box>
          </VStack>
        ),
        {
          cell: (info) => info.getValue(),
          header: 'BinLog Info',
          id: 'binLogInfo'
        }
      ),
      columnHelper.accessor((row) => row.retentionDays, {
        cell: (info) => info.getValue(),
        header: 'Retention (Days)',
        id: 'retention'
      }),
      columnHelper.accessor((row) => (row.completed ? 'Yes' : 'No'), {
        cell: (info) => info.getValue(),
        header: 'Completed',
        id: 'completed'
      })
    ],
    []
  )

  const snapshotDataStats = [
    {
      key: 'Total Size',
      value: selectedCluster?.backupStat?.total_size
    },
    {
      key: 'Total File Count',
      value: selectedCluster?.backupStat?.total_file_count
    },
    {
      key: 'Total Blob Count',
      value: selectedCluster?.backupStat?.total_blob_count
    }
  ]

  const snapshotColumns = useMemo(() => [
    columnHelper.accessor((row) => row.short_id, {
      header: 'ID',
      id: 'id'
    }),
    columnHelper.accessor((row) => row.time, {
      header: 'Time'
    }),
    columnHelper.accessor((row) => row.paths?.join(','), {
      header: 'Path'
    }),
    columnHelper.accessor((row) => row.hostname, {
      header: 'Hostname'
    }),
    columnHelper.accessor((row) => row.tags?.join(','), {
      header: 'Tags'
    })
  ])
  return (
    <VStack className={styles.backupContainer}>
      <AccordionComponent
        heading={'Current Backups'}
        allowToggle={false}
        panelClassName={styles.accordionPanel}
        body={<DataTable data={data} columns={columns} className={styles.table} />}
      />
      <AccordionComponent
        heading={'Backup Snapshots'}
        allowToggle={false}
        className={styles.accordion}
        panelClassName={styles.accordionPanel}
        body={
          <VStack className={styles.snapshotContainer}>
            <TableType3 dataArray={snapshotDataStats} className={styles.statsTable} />
            <DataTable data={snapshotData} columns={snapshotColumns} className={styles.table} />
          </VStack>
        }
      />
    </VStack>
  )
}

export default Backups
