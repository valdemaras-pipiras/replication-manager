// replication-manager - Replication Manager Monitoring and CLI for MariaDB and MySQL
// Copyright 2017 Signal 18 Cloud SAS
// Authors: Guillaume Lefranc <guillaume@signal18.io>
//          Stephane Varoqui  <svaroqui@gmail.com>
// This source code is licensed under the GNU General Public License, version 3.

package cluster

import (
	"os/exec"
	"strconv"

	"github.com/signal18/replication-manager/config"
	"github.com/signal18/replication-manager/utils/alert"
	"github.com/signal18/replication-manager/utils/state"
)

func (cluster *Cluster) BashScriptAlert(alert alert.Alert) error {
	if cluster.Conf.AlertScript != "" {
		cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, "INFO", "Calling alert script")
		var out []byte
		out, err := exec.Command(cluster.Conf.AlertScript, alert.Cluster, alert.Host, alert.PrevState, alert.State).CombinedOutput()
		if err != nil {
			cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, "ERROR", "%s", err)
		}

		cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, "INFO", "Alert script complete: %s", string(out))
	}
	return nil
}

func (cluster *Cluster) BashScriptOpenSate(state state.State) error {
	if cluster.Conf.MonitoringOpenStateScript != "" {
		cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, "INFO", "Calling open state script")
		var out []byte
		out, err := exec.Command(cluster.Conf.MonitoringOpenStateScript, cluster.Name, state.ServerUrl, state.ErrKey).CombinedOutput()
		if err != nil {
			cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, "ERROR", "%s", err)
		}

		cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, "INFO", "Open state script complete: %s", string(out))
	}
	return nil
}
func (cluster *Cluster) BashScriptCloseSate(state state.State) error {
	if cluster.Conf.MonitoringCloseStateScript != "" {
		cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, "INFO", "Calling close state script")
		var out []byte
		out, err := exec.Command(cluster.Conf.MonitoringCloseStateScript, cluster.Name, state.ServerUrl, state.ErrKey).CombinedOutput()
		if err != nil {
			cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, "ERROR", "%s", err)
		}

		cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, "INFO", "Close state script complete %s:", string(out))
	}
	return nil
}

func (cluster *Cluster) failoverPostScript(fail bool) {
	if cluster.Conf.PostScript != "" {

		var out []byte
		var err error

		cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, config.LvlInfo, "Calling post-failover script")
		failtype := "failover"
		if !fail {
			failtype = "switchover"
		}
		out, err = exec.Command(cluster.Conf.PostScript, cluster.oldMaster.Host, cluster.GetMaster().Host, cluster.oldMaster.Port, cluster.GetMaster().Port, cluster.oldMaster.MxsServerName, cluster.GetMaster().MxsServerName, failtype).CombinedOutput()
		if err != nil {
			cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, config.LvlErr, "%s", err)
		}
		cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, config.LvlInfo, "Post-failover script complete %s", string(out))
	}
}

func (cluster *Cluster) failoverPreScript(fail bool) {
	// Call pre-failover script
	if cluster.Conf.PreScript != "" {
		failtype := "failover"
		if !fail {
			failtype = "switchover"
		}

		cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, config.LvlInfo, "Calling pre-failover script")
		var out []byte
		var err error
		out, err = exec.Command(cluster.Conf.PreScript, cluster.oldMaster.Host, cluster.GetMaster().Host, cluster.oldMaster.Port, cluster.GetMaster().Port, cluster.oldMaster.MxsServerName, cluster.GetMaster().MxsServerName, failtype).CombinedOutput()
		if err != nil {
			cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, config.LvlErr, "%s", err)
		}
		cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, config.LvlInfo, "Pre-failover script complete:", string(out))
	}
}

func (cluster *Cluster) BinlogRotationScript(srv *ServerMonitor) error {
	if cluster.Conf.BinlogRotationScript != "" {
		cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, "INFO", "Calling binlog rotation script")
		var out []byte
		out, err := exec.Command(cluster.Conf.BinlogRotationScript, cluster.Name, srv.Host, srv.Port, srv.BinaryLogFile, srv.BinaryLogFilePrevious, srv.BinaryLogOldestFile).CombinedOutput()
		if err != nil {
			cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, "ERROR", "%s", err)
		}

		cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, "INFO", "Binlog rotation script complete: %s", string(out))
	}
	return nil
}

func (cluster *Cluster) BinlogCopyScript(srv *ServerMonitor, binlog string, isPurge bool) error {
	if cluster.Conf.BinlogCopyScript != "" {
		cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, "INFO", "Calling binlog copy script on %s. Binlog: %s", srv.URL, binlog)
		var out []byte
		out, err := exec.Command(cluster.Conf.BinlogCopyScript, cluster.Name, srv.Host, srv.Port, strconv.Itoa(cluster.Conf.OnPremiseSSHPort), srv.BinaryLogDir, srv.GetMyBackupDirectory(), binlog).CombinedOutput()
		if err != nil {
			cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, "ERROR", "%s", err)
		} else {
			// Skip backup to restic if in purge binlog
			if !isPurge {
				// Backup to restic when no error (defer to prevent unfinished physical copy)
				backtype := "binlog"
				defer srv.BackupRestic(cluster.Conf.Cloud18GitUser, cluster.Name, srv.DBVersion.Flavor, srv.DBVersion.ToString(), backtype)
			}
		}

		cluster.LogModulePrintf(cluster.Conf.Verbose, config.ConstLogModGeneral, "INFO", "Binlog copy script complete: %s", string(out))
	}
	return nil
}
